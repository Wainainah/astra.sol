use crate::constants::{BPS_DENOMINATOR, MAX_SEED_USD, MIN_SEED_USD, TOTAL_FEE_BPS};
use crate::curve;
use crate::errors::AstraError;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_lang::system_program;

#[derive(Accounts)]
pub struct CreateLaunch<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        constraint = !config.paused @ AstraError::ProtocolPaused
    )]
    pub config: Account<'info, GlobalConfig>,

    #[account(
        init,
        payer = creator,
        space = 8 + Launch::INIT_SPACE,
        seeds = [b"launch", creator.key().as_ref(), config.total_launches.to_le_bytes().as_ref()],
        bump
    )]
    pub launch: Account<'info, Launch>,

    #[account(
        init,
        payer = creator,
        space = 8 + Position::INIT_SPACE,
        seeds = [b"position", launch.key().as_ref(), creator.key().as_ref()],
        bump
    )]
    pub creator_position: Account<'info, Position>,

    /// Creator stats - initialized if first launch
    #[account(
        init_if_needed,
        payer = creator,
        space = 8 + CreatorStats::INIT_SPACE,
        seeds = [b"creator_stats", creator.key().as_ref()],
        bump
    )]
    pub creator_stats: Account<'info, CreatorStats>,

    /// CHECK: Protocol fee wallet verified against config
    #[account(mut, address = config.protocol_fee_wallet)]
    pub protocol_fee_wallet: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateLaunchArgs {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub seed_lamports: u64,
}

pub fn handler(ctx: Context<CreateLaunch>, args: CreateLaunchArgs) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let launch = &mut ctx.accounts.launch;
    let position = &mut ctx.accounts.creator_position;

    // 1. Validation
    require!(
        args.name.len() > 0 && args.name.len() <= 50,
        AstraError::InvalidCalculation
    );
    require!(
        args.symbol.len() > 0 && args.symbol.len() <= 10,
        AstraError::InvalidCalculation
    );
    require!(
        args.uri.len() > 0 && args.uri.len() <= 200,
        AstraError::InvalidCalculation
    );
    require!(args.seed_lamports > 0, AstraError::InvalidCalculation);

    // Check against USD minimum (converted to lamports)
    let min_lamports = config
        .usd_to_lamports(MIN_SEED_USD)
        .ok_or(AstraError::PriceOracleUnavailable)?;
    require!(
        args.seed_lamports >= min_lamports,
        AstraError::SeedAmountTooLow
    );

    // Check against USD maximum (converted to lamports)
    let max_lamports = config
        .usd_to_lamports(MAX_SEED_USD)
        .ok_or(AstraError::PriceOracleUnavailable)?;
    require!(
        args.seed_lamports <= max_lamports,
        AstraError::SeedAmountTooHigh
    );

    // 2. Fee Calculation (1% protocol fee)
    let fee = args
        .seed_lamports
        .checked_mul(TOTAL_FEE_BPS)
        .ok_or(AstraError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR)
        .ok_or(AstraError::MathOverflow)?;
    let net_deposit = args
        .seed_lamports
        .checked_sub(fee)
        .ok_or(AstraError::MathOverflow)?;

    // 3. Calculate seed shares (using 0 as initial supply)
    let shares = curve::buy_return(net_deposit, 0)?;

    // 4. Initialize Launch State (V7 Simplified)
    launch.launch_id = config.total_launches;
    launch.creator = ctx.accounts.creator.key();
    launch.name = args.name.clone();
    launch.symbol = args.symbol.clone();
    launch.uri = args.uri;

    // V7: All shares go to total_shares (no locked/unlocked split)
    launch.total_shares = shares;
    launch.total_sol = net_deposit;

    // Creator seed tracked separately for vesting
    launch.creator_seed_shares = shares;
    launch.creator_seed_sol = net_deposit;

    launch.graduated = false;
    launch.refund_mode = false;
    launch.creator_accrued_fees = 0;
    launch.protocol_accrued_fees = 0;
    launch.created_at = Clock::get()?.unix_timestamp;
    launch.bump = ctx.bumps.launch;

    // 5. Initialize Creator Position (V7 Simplified)
    position.launch = launch.key();
    position.user = ctx.accounts.creator.key();
    position.shares = 0; // Will be set after vesting
    position.sol_basis = 0;
    position.locked_shares = shares; // All seed shares locked for vesting
    position.vested_shares_claimed = 0;
    position.first_buy_at = launch.created_at;
    position.last_updated_at = launch.created_at;
    position.bump = ctx.bumps.creator_position;

    // 6. Initialize/Update Creator Stats
    let creator_stats = &mut ctx.accounts.creator_stats;
    if creator_stats.creator == Pubkey::default() {
        creator_stats.creator = ctx.accounts.creator.key();
        creator_stats.graduated_count = 0;
        creator_stats.total_fees_earned = 0;
        creator_stats.total_launches = 0;
        creator_stats.bump = ctx.bumps.creator_stats;
    }
    creator_stats.record_launch();

    // 7. Transfer Protocol Fee
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.creator.to_account_info(),
                to: ctx.accounts.protocol_fee_wallet.to_account_info(),
            },
        ),
        fee,
    )?;

    // 8. Transfer Net Deposit to Launch PDA
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.creator.to_account_info(),
                to: launch.to_account_info(),
            },
        ),
        net_deposit,
    )?;

    // 9. Emit Event and Update Config
    emit!(crate::events::LaunchCreated {
        launch_id: launch.launch_id,
        creator: launch.creator,
        name: launch.name.clone(),
        symbol: launch.symbol.clone(),
        seed_lamports: args.seed_lamports,
        seed_shares: shares,
        timestamp: launch.created_at,
    });

    config.total_launches = config
        .total_launches
        .checked_add(1)
        .ok_or(AstraError::MathOverflow)?;

    Ok(())
}
