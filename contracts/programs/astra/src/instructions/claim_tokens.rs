//! Claim Tokens instruction handler - V7
//!
//! Processes token claims after graduation with:
//! - Reentrancy protection
//! - NO auto-unlock needed (all shares already unlocked in V7)
//! - Creator's SEED shares require vesting completion before claiming
//! - Position account closed after claim to recycle rent
//!
//! V7 SIMPLIFICATION:
//! - All shares are unlocked (no 92/8 split)
//! - Only creator seed shares are locked (for vesting)
//! - Regular buyers can claim immediately after graduation

use crate::constants::TOKENS_FOR_HOLDERS;
use crate::errors::AstraError;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Token, TokenAccount};

#[derive(Accounts)]
pub struct ClaimTokens<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: The user account whose tokens are being claimed.
    /// Verified via the position PDA seeds below.
    #[account(mut)]
    pub user: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = launch.graduated @ AstraError::NotGraduated
    )]
    pub launch: Account<'info, Launch>,

    #[account(
        mut,
        close = payer, // Recycle rent to the payer (Janitor/User)
        seeds = [b"position", launch.key().as_ref(), user.key().as_ref()],
        bump = position.bump,
        constraint = !position.has_claimed_tokens @ AstraError::AlreadyClaimed
    )]
    pub position: Account<'info, Position>,

    /// CHECK: Mint verified via launch state
    #[account(
        mut,
        constraint = token_mint.key() == launch.token_mint.unwrap() @ AstraError::InvalidCalculation
    )]
    pub token_mint: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = token_mint,
        associated_token::authority = user
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = launch
    )]
    pub launch_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<ClaimTokens>) -> Result<()> {
    let launch = &mut ctx.accounts.launch;
    let position = &mut ctx.accounts.position;

    // Reentrancy protection
    require!(
        !launch.operation_in_progress,
        AstraError::InvalidCalculation
    );
    launch.operation_in_progress = true;

    let is_creator = ctx.accounts.user.key() == launch.creator;

    if is_creator {
        // Creator: Must complete vesting of seed shares before claiming
        let seed_shares = launch.creator_seed_shares;
        let vested_so_far = position.vested_shares_claimed;

        // Calculate remaining unvested seed shares
        let remaining_seed = seed_shares.saturating_sub(vested_so_far);

        // Seed must be fully vested before claiming
        require!(remaining_seed == 0, AstraError::VestingNotComplete);

        // V7: No auto-unlock needed - all shares already unlocked
        // Creator's unlocked_shares = total shares (seed was moved via claim_vesting)
    }
    // V7: Regular buyers - all shares already unlocked, no action needed

    // Proportional token distribution
    // Formula: tokens = (user_shares * TOKENS_FOR_HOLDERS) / total_shares_at_graduation
    let tokens_for_holders_u128 = (TOKENS_FOR_HOLDERS as u128) * 1_000_000_000; // Add 9 decimals

    // V7: Use simplified position.shares (all unlocked)
    let user_shares = position.shares as u128;
    let total_shares = launch.total_shares_at_graduation as u128;

    // Safety check
    require!(total_shares > 0, AstraError::InvalidCalculation);

    // Calculate proportional tokens (use u128 to prevent overflow)
    let amount = user_shares
        .checked_mul(tokens_for_holders_u128)
        .ok_or(AstraError::MathOverflow)?
        .checked_div(total_shares)
        .ok_or(AstraError::MathOverflow)? as u64;

    require!(amount > 0, AstraError::NoSharesToClaim);

    // Transfer Tokens from Launch PDA to User ATA
    let launch_id_bytes = launch.launch_id.to_le_bytes();
    let seeds = &[
        b"launch",
        launch.creator.as_ref(),
        &launch_id_bytes,
        &[launch.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.launch_token_account.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: launch.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;

    // Update State (Position account is closed by Anchor after this)
    position.has_claimed_tokens = true;
    position.shares = 0;

    emit!(crate::events::TokensClaimed {
        launch: launch.key(),
        user: ctx.accounts.user.key(),
        tokens_claimed: amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    // Reset reentrancy flag
    launch.operation_in_progress = false;
    Ok(())
}
