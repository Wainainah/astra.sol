use crate::errors::AstraError;
use crate::state::*;
use anchor_lang::prelude::*;

/// Closes a launch account after all refunds have been processed
/// Recovers rent to the caller (incentive for janitor bot)
#[derive(Accounts)]
pub struct CloseLaunch<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    #[account(
        mut,
        close = caller,
        constraint = launch.refund_mode @ AstraError::RefundModeNotActive,
        constraint = launch.total_shares == 0 @ AstraError::LaunchNotEmpty,
        constraint = launch.total_sol == 0 @ AstraError::LaunchNotEmpty,
    )]
    pub launch: Account<'info, Launch>,
}

pub fn handler(ctx: Context<CloseLaunch>) -> Result<()> {
    emit!(crate::events::LaunchClosed {
        launch: ctx.accounts.launch.key(),
        caller: ctx.accounts.caller.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
