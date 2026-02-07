use anchor_lang::prelude::*;

/// Vault account - holds LP tokens and tracks yield
///
/// Created at graduation, holds Raydium LP tokens
/// Yield is distributed to creator (60%), protocol (10%), caller (1%), compounded (29%)
///
/// PDA seeds: [b"vault", launch.key().as_ref()]
#[account]
#[derive(InitSpace)]
pub struct Vault {
    /// The launch this vault belongs to
    pub launch: Pubkey,

    /// Creator receiving 60% of yield
    pub creator: Pubkey,

    /// LP token mint from Raydium
    pub lp_mint: Pubkey,

    /// LP tokens held by this vault
    pub lp_balance: u64,

    /// Is vault activated?
    pub activated: bool,

    /// ------ YIELD TRACKING ------
    pub total_yield_collected: u64,
    pub total_creator_paid: u64,
    pub total_protocol_paid: u64,
    pub total_compounded: u64,
    pub total_caller_paid: u64,

    /// Last poke timestamp
    pub last_poke_at: i64,

    /// Bump for PDA derivation
    pub bump: u8,
}

impl Vault {
    /// Calculate yield distribution
    ///
    /// Distribution (ADR-001):
    /// - Creator: 60%
    /// - Protocol: 10%
    /// - Caller: 1%
    /// - Compounded back to LP: 29%
    pub fn calculate_yield_distribution(yield_amount: u64) -> (u64, u64, u64, u64) {
        let creator = (yield_amount * 60) / 100;
        let protocol = (yield_amount * 10) / 100;
        let caller = (yield_amount * 1) / 100;
        let compounded = yield_amount - creator - protocol - caller;

        (creator, protocol, caller, compounded)
    }
}
