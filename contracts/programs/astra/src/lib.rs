//! Astra Protocol V7 - Token Launchpad with Bonding Curves
//!
//! A bulletproof rewrite with:
//! - USD-based configuration (all monetary values in USD, converted at runtime)
//! - Dynamic share issuance (no cap - graduate at $42K USD market cap)
//! - No 92/8 split (all shares 100% unlocked)
//! - Simplified state structure
//! - Pyth oracle integration for price feeds
//!
//! # Architecture
//!
//! ## Core Concepts
//! - **Launch**: A token launch on the bonding curve
//! - **Shares**: Pre-graduation positions that convert proportionally to tokens
//! - **Bonding Curve**: Quadratic pricing (deterministic, no impermanent loss)
//! - **Graduation**: When $42K USD market cap reached, creates Raydium pool
//!
//! ## Key Features
//! - Anti-rug: Creator shares vest over 42 days
//! - Fair launch: USD-based economics, not SOL-volatile
//! - Exit guarantee: Sell anytime for proportional SOL (no gains until graduation)
//! - Yield sharing: LP fees distributed to creator/protocol
//! - Graduation gates: Min holders (100) + max concentration (10%) enforced off-chain

use anchor_lang::prelude::*;

pub mod constants;
pub mod curve;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;

// Program ID - Replace with actual deployed program ID
// devnet: Update after deployment
// mainnet: Update after deployment
declare_id!("5AWQHT1RLaHbTiwcsPouTrTaVSA2XGyFHc8iTNp6Ruzu");

#[program]
pub mod astra {
    use super::*;

    /// Initialize the protocol with configuration
    pub fn initialize(
        ctx: Context<Initialize>,
        operator_wallet: Pubkey,
        protocol_fee_wallet: Pubkey,
        vault_protocol_wallet: Pubkey,
        min_seed_lamports: u64,
    ) -> Result<()> {
        instructions::initialize::handler(
            ctx,
            operator_wallet,
            protocol_fee_wallet,
            vault_protocol_wallet,
            min_seed_lamports,
        )
    }

    /// Create a new token launch
    pub fn create_launch(ctx: Context<CreateLaunch>, args: CreateLaunchArgs) -> Result<()> {
        instructions::create_launch::handler(ctx, args)
    }

    /// Buy shares on the bonding curve
    pub fn buy(ctx: Context<Buy>, args: BuyArgs) -> Result<()> {
        instructions::buy::handler(ctx, args)
    }

    /// Sell shares for proportional SOL
    pub fn sell(ctx: Context<Sell>, args: SellArgs) -> Result<()> {
        instructions::sell::handler(ctx, args)
    }

    /// Graduate launch to Raydium (operator only)
    /// Graduation gates checked off-chain by cron job
    pub fn graduate(ctx: Context<Graduate>) -> Result<()> {
        instructions::graduate::handler(ctx)
    }

    /// Force graduate launch (authority only - emergency override)
    /// Bypasses all graduation gates for emergency situations
    pub fn force_graduate(ctx: Context<ForceGraduate>) -> Result<()> {
        instructions::force_graduate::handler(ctx)
    }

    /// Claim SPL tokens after graduation
    pub fn claim_tokens(ctx: Context<ClaimTokens>) -> Result<()> {
        instructions::claim_tokens::handler(ctx)
    }

    /// Claim vested shares (creator only, post-graduation)
    pub fn claim_vesting(ctx: Context<ClaimVesting>) -> Result<()> {
        instructions::claim_vesting::handler(ctx)
    }

    /// Claim accrued creator fees
    pub fn claim_creator_fees(ctx: Context<ClaimCreatorFees>) -> Result<()> {
        instructions::claim_creator_fees::handler(ctx)
    }

    /// Claim refund (user initiated, refund mode only)
    pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
        instructions::claim_refund::handler(ctx)
    }

    /// Collect and distribute vault yield
    pub fn poke(ctx: Context<Poke>) -> Result<()> {
        instructions::poke::handler(ctx)
    }

    /// Enable refund mode (permissionless after 7 days)
    pub fn enable_refund(ctx: Context<EnableRefund>) -> Result<()> {
        instructions::enable_refund::handler(ctx)
    }

    /// Push refund to user (permissionless, closes position)
    pub fn push_refund(ctx: Context<PushRefund>) -> Result<()> {
        instructions::push_refund::handler(ctx)
    }

    /// Close launch after all refunds processed
    pub fn close_launch(ctx: Context<CloseLaunch>) -> Result<()> {
        instructions::close_launch::handler(ctx)
    }
}
