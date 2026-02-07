use anchor_lang::prelude::*;

/// Launch account - represents a token launch on the bonding curve
///
/// V7 SIMPLIFICATION:
/// - Removed 92/8 split (all shares are unlocked)
/// - Simplified state tracking (total_shares, total_sol)
/// - Creator vesting tracked separately
/// - Dynamic share issuance (no cap - graduate at USD market cap target)
#[account]
#[derive(InitSpace)]
pub struct Launch {
    /// Unique launch ID (incrementing)
    pub launch_id: u64,

    /// Creator of this launch
    pub creator: Pubkey,

    /// ------ METADATA ------
    #[max_len(50)]
    pub name: String,

    #[max_len(10)]
    pub symbol: String,

    #[max_len(200)]
    pub uri: String, // Metadata URI (image, description)

    /// ------ SUPPLY TRACKING (V7 SIMPLIFIED) ------
    /// Total shares issued (dynamic - no cap)
    /// All shares are unlocked - no 92/8 split
    pub total_shares: u64,

    /// Total SOL in the pool (all deposits)
    pub total_sol: u64,

    /// ------ CREATOR SEED (VESTING) ------
    /// Creator's initial seed shares (tracked separately for vesting)
    /// These are locked and vest over 42 days
    pub creator_seed_shares: u64,

    /// Creator's seed SOL basis
    pub creator_seed_sol: u64,

    /// ------ STATE FLAGS ------
    /// Has this launch graduated to Raydium?
    pub graduated: bool,

    /// Is refund mode active?
    pub refund_mode: bool,

    /// ------ GRADUATION DATA ------
    /// The SPL token mint (created at graduation)
    pub token_mint: Option<Pubkey>,

    /// The Raydium pool address
    pub pool_address: Option<Pubkey>,

    /// The vault for LP tokens
    pub vault: Option<Pubkey>,

    /// ------ VESTING ------
    /// Timestamp when vesting started (graduation time)
    pub vesting_start: Option<i64>,

    /// Creator's claimed vested shares so far
    pub creator_claimed_shares: u64,

    /// ------ TIMESTAMPS ------
    /// Launch creation time
    pub created_at: i64,

    /// Graduation time (if graduated)
    pub graduated_at: Option<i64>,

    /// Refund enabled time (if failed)
    pub refund_enabled_at: Option<i64>,

    /// ------ SAFETY ------
    /// Reentrancy guard - set to true during operations
    pub operation_in_progress: bool,

    /// ------ FEE TRACKING ------
    /// Creator's accrued fees (lamports) - claimable after graduation
    pub creator_accrued_fees: u64,

    /// Protocol's accrued fees (lamports) - auto-collected to treasury
    pub protocol_accrued_fees: u64,

    /// Total shares snapshot at graduation (for proportional token distribution)
    pub total_shares_at_graduation: u64,

    /// Bump for PDA derivation
    pub bump: u8,
}

impl Launch {
    /// Check if launch can be graduated
    /// Basic checks only - full graduation gates checked off-chain
    pub fn can_graduate(&self) -> bool {
        !self.graduated && !self.refund_mode && self.total_shares > 0
    }
    
    /// Calculate current market cap in USD
    /// Returns None if price is not available (0)
    pub fn market_cap_usd(&self, sol_price_usd: u64) -> Option<u64> {
        if sol_price_usd == 0 {
            return None;
        }
        
        // market_cap = total_sol * sol_price_usd / 1e9 (lamports to SOL conversion)
        let market_cap = (self.total_sol as u128)
            .checked_mul(sol_price_usd as u128)?
            .checked_div(1_000_000_000)?;
            
        Some(market_cap as u64)
    }
}
