use crate::errors::AstraError;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ClaimRefund<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = launch.refund_mode @ AstraError::RefundModeNotActive
    )]
    pub launch: Account<'info, Launch>,

    #[account(
        mut,
        seeds = [b"position", launch.key().as_ref(), user.key().as_ref()],
        bump = position.bump,
        constraint = !position.has_claimed_refund @ AstraError::AlreadyClaimed
    )]
    pub position: Account<'info, Position>,
}

pub fn handler(ctx: Context<ClaimRefund>) -> Result<()> {
    let launch = &mut ctx.accounts.launch;
    let position = &mut ctx.accounts.position;

    // V7 SIMPLIFICATION:
    // - All shares are 100% unlocked (no 92/8 split)
    // - Single sol_basis field for refund calculation
    let refund_amount = position.sol_basis;

    // Skip zero refunds (shouldn't happen with proper constraints, but defensive)
    if refund_amount == 0 {
        position.has_claimed_refund = true;
        emit!(crate::events::RefundClaimed {
            launch: launch.key(),
            user: ctx.accounts.user.key(),
            sol_refunded: 0,
            timestamp: Clock::get()?.unix_timestamp,
        });
        return Ok(());
    }

    // Verify launch has sufficient funds
    let launch_balance = launch.to_account_info().lamports();
    let rent = Rent::get()?.minimum_balance(8 + Launch::INIT_SPACE);
    let available = launch_balance.saturating_sub(rent);

    require!(available >= refund_amount, AstraError::InsufficientFunds);

    // Transfer refund from launch PDA to user
    **launch.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
    **ctx.accounts.user.try_borrow_mut_lamports()? += refund_amount;

    // Mark as claimed
    position.has_claimed_refund = true;

    // V7 SIMPLIFICATION:
    // Update only total_shares and total_sol (no locked/unlocked split)
    launch.total_shares = launch.total_shares.saturating_sub(position.shares);
    launch.total_sol = launch.total_sol.saturating_sub(position.sol_basis);

    emit!(crate::events::RefundClaimed {
        launch: launch.key(),
        user: ctx.accounts.user.key(),
        sol_refunded: refund_amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
