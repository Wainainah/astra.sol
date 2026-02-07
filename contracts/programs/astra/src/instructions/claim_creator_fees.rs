use crate::errors::AstraError;
use crate::events::CreatorFeesClaimed;
use crate::state::{CreatorStats, Launch};
use anchor_lang::prelude::*;

/// Claim creator fees instruction
///
/// Allows the creator to claim accrued fees after their launch has graduated.
/// Fees are accumulated from trading activity (buys/sells) during the bonding
/// curve phase and are claimable only after graduation.
///
/// # Constraints
/// - Creator must be the launch creator
/// - Launch must be graduated
/// - Launch must have accrued fees to claim
///
/// # Safety
/// - Uses reentrancy protection via `operation_in_progress` flag
/// - All math operations use checked arithmetic
#[derive(Accounts)]
pub struct ClaimCreatorFees<'info> {
    /// The creator claiming fees (must be launch creator)
    #[account(mut)]
    pub creator: Signer<'info>,

    /// The launch account to claim fees from
    /// Must be graduated and have accrued fees
    #[account(
        mut,
        constraint = launch.creator == creator.key() @ AstraError::NotCreator,
        constraint = launch.graduated @ AstraError::NotGraduated,
        constraint = launch.creator_accrued_fees > 0 @ AstraError::NoFeesToClaim
    )]
    pub launch: Account<'info, Launch>,

    /// Creator stats account for tracking lifetime earnings
    #[account(
        mut,
        seeds = [b"creator_stats", creator.key().as_ref()],
        bump = creator_stats.bump
    )]
    pub creator_stats: Account<'info, CreatorStats>,
}

/// Handler for claiming creator fees
///
/// Transfers accrued fees from the launch PDA to the creator wallet
/// and updates the creator's lifetime earnings.
pub fn handler(ctx: Context<ClaimCreatorFees>) -> Result<()> {
    let launch = &mut ctx.accounts.launch;
    let creator_stats = &mut ctx.accounts.creator_stats;

    // Reentrancy protection - prevent reentrant calls during fee transfer
    require!(!launch.operation_in_progress, AstraError::InvalidCalculation);
    launch.operation_in_progress = true;

    // Get the amount of fees to claim
    let amount = launch.creator_accrued_fees;

    // Double-check there are fees to claim (belt and suspenders with constraint)
    require!(amount > 0, AstraError::NoFeesToClaim);

    // Reset accrued fees before transfer to prevent reentrancy attacks
    launch.creator_accrued_fees = 0;

    // Update creator's lifetime earnings with overflow protection
    creator_stats.total_fees_earned = creator_stats
        .total_fees_earned
        .checked_add(amount)
        .ok_or(AstraError::MathOverflow)?;

    // Transfer SOL from launch PDA to creator with overflow protection
    // Using direct lamport manipulation for PDA-to-account transfers
    **launch
        .to_account_info()
        .try_borrow_mut_lamports()? = launch
        .to_account_info()
        .lamports()
        .checked_sub(amount)
        .ok_or(AstraError::MathOverflow)?;
    **ctx
        .accounts
        .creator
        .try_borrow_mut_lamports()? = ctx
        .accounts
        .creator
        .lamports()
        .checked_add(amount)
        .ok_or(AstraError::MathOverflow)?;

    // Emit event for off-chain tracking
    emit!(CreatorFeesClaimed {
        launch: launch.key(),
        creator: ctx.accounts.creator.key(),
        amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    // Reset reentrancy flag
    launch.operation_in_progress = false;

    Ok(())
}
