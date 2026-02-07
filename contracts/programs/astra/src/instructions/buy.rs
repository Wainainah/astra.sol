//! Buy instruction handler - V7
//!
//! Processes token purchases on the bonding curve with:
//! - Reentrancy protection
//! - Overflow-protected fee calculations
//! - 1% total fee split between creator (0.3-0.5%) and protocol (0.5-0.7%)
//! - Dynamic share issuance (no cap)
//! - NO 92/8 split - all shares are unlocked
//! - Market cap tracking for graduation triggers

use crate::constants::{BPS_DENOMINATOR, MAX_BUY_LAMPORTS, TOTAL_FEE_BPS, GRADUATION_MARKET_CAP_USD, GRADUATION_THRESHOLD_NOTIFICATION_BPS};
use crate::curve;
use crate::errors::AstraError;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_lang::system_program;

#[derive(Accounts)]
pub struct Buy<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, GlobalConfig>,

    #[account(
        mut,
        constraint = !launch.graduated @ AstraError::AlreadyGraduated,
        constraint = !launch.refund_mode @ AstraError::RefundModeActive
    )]
    pub launch: Account<'info, Launch>,

    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + Position::INIT_SPACE,
        seeds = [b"position", launch.key().as_ref(), buyer.key().as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,

    /// Creator stats for fee tier determination
    #[account(
        seeds = [b"creator_stats", launch.creator.as_ref()],
        bump = creator_stats.bump
    )]
    pub creator_stats: Account<'info, CreatorStats>,

    /// CHECK: Protocol fee wallet verified against config
    #[account(mut, address = config.protocol_fee_wallet)]
    pub protocol_fee_wallet: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct BuyArgs {
    pub sol_amount: u64,
    pub min_shares_out: u64,
}

pub fn handler(ctx: Context<Buy>, args: BuyArgs) -> Result<()> {
    let launch = &mut ctx.accounts.launch;
    let position = &mut ctx.accounts.position;
    let creator_stats = &ctx.accounts.creator_stats;
    let config = &ctx.accounts.config;

    // Input validation
    require!(args.sol_amount > 0, AstraError::InvalidCalculation);
    require!(
        args.sol_amount <= MAX_BUY_LAMPORTS,
        AstraError::InvalidCalculation
    );
    require!(args.min_shares_out > 0, AstraError::InvalidCalculation);

    // Reentrancy protection
    require!(
        !launch.operation_in_progress,
        AstraError::InvalidCalculation
    );
    launch.operation_in_progress = true;

    // 1. Determine creator fee rate based on verification
    let creator_fee_bps = creator_stats.get_creator_fee_bps();
    let protocol_fee_bps = TOTAL_FEE_BPS
        .checked_sub(creator_fee_bps)
        .ok_or(AstraError::MathOverflow)?;

    // 2. Fee Calculation with overflow protection
    let total_fee = args
        .sol_amount
        .checked_mul(TOTAL_FEE_BPS)
        .ok_or(AstraError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR)
        .ok_or(AstraError::MathOverflow)?;
    let creator_fee = args
        .sol_amount
        .checked_mul(creator_fee_bps)
        .ok_or(AstraError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR)
        .ok_or(AstraError::MathOverflow)?;
    let protocol_fee = args
        .sol_amount
        .checked_mul(protocol_fee_bps)
        .ok_or(AstraError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR)
        .ok_or(AstraError::MathOverflow)?;
    let net_sol = args
        .sol_amount
        .checked_sub(total_fee)
        .ok_or(AstraError::MathOverflow)?;

    // 3. Calculate Shares via Curve (no cap - dynamic issuance)
    let shares = curve::buy_return(net_sol, launch.total_shares)?;

    require!(shares >= args.min_shares_out, AstraError::SlippageExceeded);

    // 4. Update Position (V7: No 92/8 split, all shares unlocked)
    if position.first_buy_at == 0 {
        position.launch = launch.key();
        position.user = ctx.accounts.buyer.key();
        position.first_buy_at = Clock::get()?.unix_timestamp;
        position.vested_shares_claimed = 0;
        position.bump = ctx.bumps.position;
    }

    position.shares = position
        .shares
        .checked_add(shares)
        .ok_or(AstraError::MathOverflow)?;
    position.sol_basis = position
        .sol_basis
        .checked_add(net_sol)
        .ok_or(AstraError::MathOverflow)?;
    position.last_updated_at = Clock::get()?.unix_timestamp;

    // 5. Update Launch Totals (V7: Simplified, no locked/unlocked split)
    let new_total_shares = launch
        .total_shares
        .checked_add(shares)
        .ok_or(AstraError::MathOverflow)?;
    launch.total_shares = new_total_shares;
    
    let new_total_sol = launch
        .total_sol
        .checked_add(net_sol)
        .ok_or(AstraError::MathOverflow)?;
    launch.total_sol = new_total_sol;

    // 6. Track Creator & Protocol Fees
    launch.creator_accrued_fees = launch
        .creator_accrued_fees
        .checked_add(creator_fee)
        .ok_or(AstraError::MathOverflow)?;
    launch.protocol_accrued_fees = launch
        .protocol_accrued_fees
        .checked_add(protocol_fee)
        .ok_or(AstraError::MathOverflow)?;

    // 7. Transfer Protocol Fee to Treasury
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.protocol_fee_wallet.to_account_info(),
            },
        ),
        protocol_fee,
    )?;

    // 8. Transfer Creator Fee + Net SOL to Launch PDA
    let sol_to_launch = net_sol
        .checked_add(creator_fee)
        .ok_or(AstraError::MathOverflow)?;
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: launch.to_account_info(),
            },
        ),
        sol_to_launch,
    )?;

    // 9. Emit Purchase Event
    let now = Clock::get()?.unix_timestamp;
    emit!(crate::events::SharesPurchased {
        launch: launch.key(),
        buyer: ctx.accounts.buyer.key(),
        sol_amount: args.sol_amount,
        shares_received: shares,
        is_seed_buy: false,
        timestamp: now,
    });

    // 10. Check market cap and emit event if approaching graduation
    // Note: Market cap calculation requires SOL price from config
    if config.sol_price_usd > 0 {
        let market_cap_usd = (new_total_sol as u128)
            .checked_mul(config.sol_price_usd as u128)
            .ok_or(AstraError::MathOverflow)?
            .checked_div(1_000_000_000)
            .ok_or(AstraError::MathOverflow)? as u64;
        
        emit!(crate::events::MarketCapUpdated {
            launch: launch.key(),
            market_cap_usd,
            total_shares: new_total_shares,
            total_sol: new_total_sol,
            timestamp: now,
        });
        
        // Emit readiness event if approaching graduation threshold
        let threshold = (GRADUATION_MARKET_CAP_USD as u128)
            .checked_mul(GRADUATION_THRESHOLD_NOTIFICATION_BPS as u128)
            .ok_or(AstraError::MathOverflow)?
            .checked_div(BPS_DENOMINATOR as u128)
            .ok_or(AstraError::MathOverflow)? as u64;
            
        if market_cap_usd >= threshold {
            emit!(crate::events::ReadyToGraduate {
                launch: launch.key(),
                market_cap_usd,
                threshold_usd: GRADUATION_MARKET_CAP_USD,
                timestamp: now,
            });
        }
    }

    // Reset reentrancy flag
    launch.operation_in_progress = false;
    Ok(())
}
