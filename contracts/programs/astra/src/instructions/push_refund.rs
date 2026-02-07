use crate::errors::AstraError;
use crate::state::*;
use anchor_lang::prelude::*;

/// Pushes a refund to a specific user's position
/// Closes the position account, rent goes to caller as gas compensation
/// Can be called by anyone (bot) - permissionless
#[derive(Accounts)]
pub struct PushRefund<'info> {
    /// Bot/anyone can call - pays gas, receives rent from closed account
    #[account(mut)]
    pub caller: Signer<'info>,

    #[account(
        mut,
        constraint = launch.refund_mode @ AstraError::RefundModeNotActive
    )]
    pub launch: Account<'info, Launch>,

    #[account(
        mut,
        seeds = [b"position", launch.key().as_ref(), recipient.key().as_ref()],
        bump = position.bump,
        constraint = !position.has_claimed_refund @ AstraError::AlreadyClaimed,
        close = caller  // Rent returns to caller as gas compensation
    )]
    pub position: Account<'info, Position>,

    /// CHECK: User receiving refund - verified by position PDA seeds
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<PushRefund>) -> Result<()> {
    let launch = &mut ctx.accounts.launch;
    let position = &ctx.accounts.position;

    // V7: Simplified refund calculation - single sol_basis value
    // (V6 had: locked_basis + unlocked_basis)
    let refund_amount = position.sol_basis;

    // Handle zero balance positions (just close account)
    if refund_amount == 0 {
        emit!(crate::events::RefundPushed {
            launch: launch.key(),
            recipient: ctx.accounts.recipient.key(),
            amount: 0,
            timestamp: Clock::get()?.unix_timestamp,
        });
        return Ok(());
    }

    // Verify launch has sufficient funds
    let launch_balance = launch.to_account_info().lamports();
    let rent = Rent::get()?.minimum_balance(8 + Launch::INIT_SPACE);
    let available = launch_balance.saturating_sub(rent);

    require!(available >= refund_amount, AstraError::InsufficientFunds);

    // Transfer from Launch PDA to recipient
    **launch.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
    **ctx.accounts.recipient.try_borrow_mut_lamports()? += refund_amount;

    // V7: Simplified launch state updates
    // (V6 had: total_locked_basis, total_unlocked_basis, total_locked_shares, total_unlocked_shares)
    launch.total_sol = launch.total_sol.saturating_sub(position.sol_basis);
    
    // Subtract all shares (both unlocked and locked for creator positions)
    // Creator seed shares are tracked separately in creator_seed_shares/creator_seed_sol
    // but the position still holds the shares until vesting is complete
    let total_position_shares = position
        .shares
        .checked_add(position.locked_shares)
        .ok_or(AstraError::MathOverflow)?;
    
    launch.total_shares = launch.total_shares.saturating_sub(total_position_shares);

    emit!(crate::events::RefundPushed {
        launch: launch.key(),
        recipient: ctx.accounts.recipient.key(),
        amount: refund_amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    // Position account closed via `close = caller` constraint
    // Rent (~0.002 SOL) returns to caller as gas compensation

    Ok(())
}
