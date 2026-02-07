use crate::errors::AstraError;
use crate::state::*;
use anchor_lang::prelude::*;

/// Poke instruction - collect and distribute vault yield
///
/// Anyone can call this permissionlessly to collect yield from the vault's
/// LP position and distribute it according to protocol rules.
///
/// # Yield Distribution (ADR-001)
/// - 1% to caller (incentivizes regular poking)
/// - 60% to creator (rewards launch creator)
/// - 10% to protocol (treasury revenue)
/// - 29% compounded (reinvested to LP, grows vault)
///
/// # Requirements
/// - Launch must be graduated (yield only available post-graduation)
/// - Vault must exist and be activated
///
/// # Notes
/// This is an MVP implementation that simulates yield collection.
/// In production, this would integrate with Raydium's fee collection.
#[derive(Accounts)]
pub struct Poke<'info> {
    /// The caller who triggers yield collection
    /// Receives 1% of collected yield as incentive
    #[account(mut)]
    pub caller: Signer<'info>,

    /// Global config - provides protocol wallet address
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, GlobalConfig>,

    /// The launch associated with this vault
    /// Must be graduated to have yield available
    #[account(constraint = launch.graduated @ AstraError::NotGraduated)]
    pub launch: Account<'info, Launch>,

    /// The vault holding LP tokens
    /// PDA: [b"vault", launch.key().as_ref()]
    #[account(
        mut,
        seeds = [b"vault", launch.key().as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    /// CHECK: Creator wallet receiving 60% yield share
    /// Verified to match vault.creator
    #[account(mut, address = vault.creator)]
    pub creator_wallet: UncheckedAccount<'info>,

    /// CHECK: Protocol wallet receiving 10% yield share
    /// Verified to match config.vault_protocol_wallet
    #[account(mut, address = config.vault_protocol_wallet)]
    pub protocol_wallet: UncheckedAccount<'info>,

    // NOTE: In full implementation, would include Raydium accounts for collecting fees
    // For MVP, we simulate yield collection
}

/// Handler for the poke instruction
///
/// Calculates yield distribution and updates vault tracking.
/// In production, this would perform actual transfers from Raydium fee accounts.
pub fn handler(ctx: Context<Poke>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let config = &ctx.accounts.config;

    // ADR-001: Yield distribution percentages (in basis points)
    // Total: 10000 bps = 100%
    const CALLER_BPS: u64 = 100;    // 1% - incentivizes regular poking
    const CREATOR_BPS: u64 = 6000;  // 60% - rewards launch creator
    const PROTOCOL_BPS: u64 = 1000; // 10% - protocol revenue
    const COMPOUND_BPS: u64 = 2900; // 29% - reinvested to grow LP position
    const TOTAL_BPS: u64 = 10000;

    // In full implementation: Query Raydium pool for collected trading fees
    // and calculate actual yield from LP position growth.
    // For this MVP scaffold: Simulate collecting yield
    let simulated_yield: u64 = 1_000_000; // 0.001 SOL for testing

    // Handle zero yield case - still update timestamp and emit event
    if simulated_yield == 0 {
        vault.last_poke_at = Clock::get()?.unix_timestamp;
        
        emit!(crate::events::Poked {
            vault: vault.key(),
            caller: ctx.accounts.caller.key(),
            total_yield: 0,
            caller_reward: 0,
            creator_reward: 0,
            protocol_reward: 0,
            compounded: 0,
            timestamp: vault.last_poke_at,
        });
        
        return Ok(());
    }

    // Calculate distribution amounts using basis points
    let caller_reward = simulated_yield
        .checked_mul(CALLER_BPS)
        .ok_or(AstraError::MathOverflow)?
        .checked_div(TOTAL_BPS)
        .ok_or(AstraError::MathOverflow)?;

    let creator_reward = simulated_yield
        .checked_mul(CREATOR_BPS)
        .ok_or(AstraError::MathOverflow)?
        .checked_div(TOTAL_BPS)
        .ok_or(AstraError::MathOverflow)?;

    let protocol_reward = simulated_yield
        .checked_mul(PROTOCOL_BPS)
        .ok_or(AstraError::MathOverflow)?
        .checked_div(TOTAL_BPS)
        .ok_or(AstraError::MathOverflow)?;

    // Compound amount is the remainder to ensure no rounding errors
    let compound_amount = simulated_yield
        .checked_sub(caller_reward)
        .ok_or(AstraError::MathOverflow)?
        .checked_sub(creator_reward)
        .ok_or(AstraError::MathOverflow)?
        .checked_sub(protocol_reward)
        .ok_or(AstraError::MathOverflow)?;

    // Verify distribution adds up correctly (sanity check)
    let total_distributed = caller_reward
        .checked_add(creator_reward)
        .ok_or(AstraError::MathOverflow)?
        .checked_add(protocol_reward)
        .ok_or(AstraError::MathOverflow)?
        .checked_add(compound_amount)
        .ok_or(AstraError::MathOverflow)?;

    require!(
        total_distributed == simulated_yield,
        AstraError::InvalidCalculation
    );

    // In full implementation: Perform actual transfers from Raydium fee accounts
    // - Transfer caller_reward to caller
    // - Transfer creator_reward to creator_wallet
    // - Transfer protocol_reward to protocol_wallet
    // - Reinvest compound_amount into LP position
    // For MVP: Transfers are simulated (would require actual Raydium integration)

    // Update vault tracking stats
    vault.total_yield_collected = vault
        .total_yield_collected
        .checked_add(simulated_yield)
        .ok_or(AstraError::MathOverflow)?;
    
    vault.total_creator_paid = vault
        .total_creator_paid
        .checked_add(creator_reward)
        .ok_or(AstraError::MathOverflow)?;
    
    vault.total_protocol_paid = vault
        .total_protocol_paid
        .checked_add(protocol_reward)
        .ok_or(AstraError::MathOverflow)?;
    
    vault.total_compounded = vault
        .total_compounded
        .checked_add(compound_amount)
        .ok_or(AstraError::MathOverflow)?;
    
    vault.total_caller_paid = vault
        .total_caller_paid
        .checked_add(caller_reward)
        .ok_or(AstraError::MathOverflow)?;
    
    vault.last_poke_at = Clock::get()?.unix_timestamp;

    // Emit Poked event for indexing and tracking
    emit!(crate::events::Poked {
        vault: vault.key(),
        caller: ctx.accounts.caller.key(),
        total_yield: simulated_yield,
        caller_reward,
        creator_reward,
        protocol_reward,
        compounded: compound_amount,
        timestamp: vault.last_poke_at,
    });

    Ok(())
}
