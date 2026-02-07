//! Claim Vesting instruction handler
//!
//! Processes vesting claims for CREATOR SEED SHARES only with:
//! - Reentrancy protection via RAII guard pattern
//! - Deterministic integer-based vesting calculations (no f64)
//! - Linear vesting over 42 days from graduation time
//! - Overflow-protected arithmetic operations
//!
//! IMPORTANT: Only the creator's initial SEED investment vests.
//! - Seed shares (100% locked at launch creation): vest over 42 days
//! - All other shares are immediately unlocked (no 92/8 split in V7)
//!
//! V7 CHANGES:
//! - Removed 92/8 split complexity
//! - Simplified state: position.shares (was unlocked_shares in V6)
//! - Only creator SEED shares vest (tracked in position.locked_shares)
//! - All shares moved to position.shares upon vesting claim

use crate::constants::VESTING_DURATION_SECONDS;
use crate::errors::AstraError;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ClaimVesting<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = launch.graduated @ AstraError::NotGraduated
    )]
    pub launch: Account<'info, Launch>,

    #[account(
        mut,
        seeds = [b"position", launch.key().as_ref(), user.key().as_ref()],
        bump = position.bump,
        // CREATOR-ONLY: Only the launch creator can use vesting
        constraint = user.key() == launch.creator @ AstraError::Unauthorized
    )]
    pub position: Account<'info, Position>,
}

/// Handler for claim_vesting instruction
///
/// Calculates claimable shares using linear vesting formula:
/// claimable = (seed_shares * elapsed_time / total_duration) - already_claimed
///
/// V7 SIMPLIFICATION:
/// - All claimed shares go directly to position.shares (100% unlocked)
/// - No 92/8 split to manage
///
/// # Arguments
/// * `ctx` - Context containing user, launch, and position accounts
///
/// # Errors
/// * `AstraError::NotGraduated` - Launch has not graduated
/// * `AstraError::Unauthorized` - Caller is not the creator
/// * `AstraError::VestingNotStarted` - Vesting period hasn't begun
/// * `AstraError::InsufficientShares` - No locked shares to claim
/// * `AstraError::NoSharesToClaim` - No shares available at current time
/// * `AstraError::MathOverflow` - Arithmetic overflow in calculations
///
/// # Security
/// - Uses reentrancy protection flag
/// - All arithmetic uses checked operations with overflow protection
/// - Uses u128 for intermediate calculations to prevent overflow
pub fn handler(ctx: Context<ClaimVesting>) -> Result<()> {
    let launch = &mut ctx.accounts.launch;
    let position = &mut ctx.accounts.position;

    // Reentrancy protection
    require!(!launch.operation_in_progress, AstraError::InvalidCalculation);
    launch.operation_in_progress = true;

    // Check if vesting has started
    let vesting_start = launch.vesting_start.ok_or(AstraError::NotGraduated)?;
    let now = Clock::get()?.unix_timestamp;

    if now < vesting_start {
        return Err(AstraError::VestingNotStarted.into());
    }

    // Calculate time elapsed, capped at vesting duration
    let time_elapsed = now
        .checked_sub(vesting_start)
        .ok_or(AstraError::MathOverflow)?;
    let capped_elapsed = time_elapsed.min(VESTING_DURATION_SECONDS);

    // IMPORTANT: Only SEED shares vest, not subsequent buy shares
    // The seed_shares value is fixed at launch creation and never changes
    let seed_shares = launch.creator_seed_shares;
    let already_claimed = launch.creator_claimed_shares;

    // If all seed shares have been claimed, nothing more to vest
    let remaining_seed = seed_shares.saturating_sub(already_claimed);
    if remaining_seed == 0 {
        launch.operation_in_progress = false;
        return Err(AstraError::NoSharesToClaim.into());
    }

    // Calculate total vested SEED shares using deterministic integer math (no f64)
    // Formula: total_vested = seed_shares * capped_elapsed / VESTING_DURATION_SECONDS
    // Using u128 to prevent overflow
    let total_vested_seed = (seed_shares as u128)
        .checked_mul(capped_elapsed as u128)
        .ok_or(AstraError::MathOverflow)?
        .checked_div(VESTING_DURATION_SECONDS as u128)
        .ok_or(AstraError::MathOverflow)? as u64;

    // Claimable = Total Vested Seed - Already Claimed
    let claimable = total_vested_seed
        .checked_sub(already_claimed)
        .ok_or(AstraError::MathOverflow)?;

    if claimable == 0 {
        launch.operation_in_progress = false;
        return Err(AstraError::NoSharesToClaim.into());
    }

    // Verify we don't claim more than currently locked (safety check)
    require!(
        claimable <= position.locked_shares,
        AstraError::InvalidCalculation
    );

    // V7 STATE UPDATE: Move shares from locked to position.shares
    // All shares in V7 are 100% unlocked once claimed
    position.locked_shares = position
        .locked_shares
        .checked_sub(claimable)
        .ok_or(AstraError::MathOverflow)?;
    position.shares = position
        .shares
        .checked_add(claimable)
        .ok_or(AstraError::MathOverflow)?;
    position.vested_shares_claimed = position
        .vested_shares_claimed
        .checked_add(claimable)
        .ok_or(AstraError::MathOverflow)?;
    position.last_updated_at = now;

    // Update launch-level tracking
    launch.creator_claimed_shares = launch
        .creator_claimed_shares
        .checked_add(claimable)
        .ok_or(AstraError::MathOverflow)?;

    emit!(crate::events::VestingClaimed {
        launch: launch.key(),
        user: ctx.accounts.user.key(),
        shares_unlocked: claimable,
        remaining_locked: position.locked_shares,
        timestamp: now,
    });

    // Reset reentrancy flag
    launch.operation_in_progress = false;
    Ok(())
}
