use crate::constants::LAUNCH_DURATION_SECONDS;
use crate::errors::AstraError;
use crate::events::RefundEnabled;
use crate::state::Launch;
use anchor_lang::prelude::*;

/// Enables refund mode for an expired launch
///
/// This instruction can be called by anyone after the launch duration has expired
/// (7 days from creation). It is permissionless to ensure users can always
/// recover their funds from failed launches.
///
/// # Requirements
/// - Launch must not be graduated
/// - Launch must not already be in refund mode
/// - At least LAUNCH_DURATION_SECONDS (7 days) must have passed since creation
///
/// # Effects
/// - Sets `refund_mode = true` on the launch
/// - Records `refund_enabled_at` timestamp
/// - Emits `RefundEnabled` event
#[derive(Accounts)]
pub struct EnableRefund<'info> {
    /// The caller - can be any signer, this is permissionless after expiry
    #[account(mut)]
    pub caller: Signer<'info>,

    /// The launch account to enable refund mode for
    #[account(
        mut,
        constraint = !launch.graduated @ AstraError::AlreadyGraduated,
        constraint = !launch.refund_mode @ AstraError::RefundModeAlreadyActive,
        constraint = is_launch_expired(&launch) @ AstraError::LaunchNotExpired
    )]
    pub launch: Account<'info, Launch>,
}

/// Checks if the launch has expired (7 days since creation)
fn is_launch_expired(launch: &Launch) -> bool {
    if let Ok(clock) = Clock::get() {
        clock.unix_timestamp >= launch.created_at + LAUNCH_DURATION_SECONDS
    } else {
        false
    }
}

/// Handler for enabling refund mode on an expired launch
///
/// This allows holders to claim refunds of their SOL proportional to their shares.
pub fn handler(ctx: Context<EnableRefund>) -> Result<()> {
    let launch = &mut ctx.accounts.launch;
    let clock = Clock::get()?;

    // Enable refund mode
    launch.refund_mode = true;
    launch.refund_enabled_at = Some(clock.unix_timestamp);

    // Emit event
    emit!(RefundEnabled {
        launch: launch.key(),
        timestamp: clock.unix_timestamp,
    });

    msg!("Refund mode enabled for launch: {}", launch.key());
    msg!("Refund enabled at timestamp: {}", clock.unix_timestamp);

    Ok(())
}
