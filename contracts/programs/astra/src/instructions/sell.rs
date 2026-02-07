use crate::curve;
use crate::errors::AstraError;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Sell<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, GlobalConfig>,

    #[account(
        mut,
        constraint = !launch.graduated @ AstraError::AlreadyGraduated,
        constraint = !launch.refund_mode @ AstraError::RefundModeActive
    )]
    pub launch: Account<'info, Launch>,

    #[account(
        mut,
        seeds = [b"position", launch.key().as_ref(), seller.key().as_ref()],
        bump = position.bump
    )]
    pub position: Account<'info, Position>,

    /// CHECK: Protocol fee wallet via config
    #[account(mut, address = config.protocol_fee_wallet)]
    pub protocol_fee_wallet: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct SellArgs {
    pub shares_to_sell: u64,
    pub min_sol_out: u64,
}

pub fn handler(ctx: Context<Sell>, args: SellArgs) -> Result<()> {
    let launch = &mut ctx.accounts.launch;
    let position = &mut ctx.accounts.position;

    // Input validation
    require!(args.shares_to_sell > 0, AstraError::InvalidCalculation);
    require!(
        args.shares_to_sell <= position.shares,
        AstraError::InsufficientShares
    );
    require!(
        args.min_sol_out <= position.sol_basis,
        AstraError::InvalidCalculation
    );

    // Reentrancy protection
    require!(
        !launch.operation_in_progress,
        AstraError::InvalidCalculation
    );
    launch.operation_in_progress = true;

    // 1. Calculate Refund (Proportional to Basis)
    // V7: Use simplified position fields (shares, sol_basis)
    let refund_amount =
        curve::sell_return(args.shares_to_sell, position.shares, position.sol_basis)?;

    // 2. No fees on sell (protocol promise)
    let net_refund = refund_amount;

    require!(net_refund >= args.min_sol_out, AstraError::SlippageExceeded);

    // 3. Update Position (V7: Simplified fields)
    position.shares = position
        .shares
        .checked_sub(args.shares_to_sell)
        .ok_or(AstraError::MathOverflow)?;
    position.sol_basis = position
        .sol_basis
        .checked_sub(refund_amount)
        .ok_or(AstraError::MathOverflow)?;
    position.last_updated_at = Clock::get()?.unix_timestamp;

    // 4. Update Launch Totals (V7: Simplified)
    launch.total_shares = launch
        .total_shares
        .checked_sub(args.shares_to_sell)
        .ok_or(AstraError::MathOverflow)?;
    launch.total_sol = launch
        .total_sol
        .checked_sub(refund_amount)
        .ok_or(AstraError::MathOverflow)?;

    // 5. Transfer Net Refund from Launch PDA to Seller
    **launch.to_account_info().try_borrow_mut_lamports()? = launch
        .to_account_info()
        .lamports()
        .checked_sub(net_refund)
        .ok_or(AstraError::MathOverflow)?;
    **ctx.accounts.seller.try_borrow_mut_lamports()? = ctx
        .accounts
        .seller
        .lamports()
        .checked_add(net_refund)
        .ok_or(AstraError::MathOverflow)?;

    // 6. Emit Event
    emit!(crate::events::SharesSold {
        launch: launch.key(),
        seller: ctx.accounts.seller.key(),
        shares_sold: args.shares_to_sell,
        sol_refunded: net_refund,
        timestamp: position.last_updated_at,
    });

    // Reset reentrancy flag
    launch.operation_in_progress = false;
    Ok(())
}
