use anchor_lang::prelude::*;

/// Creator statistics account - tracks per-creator metrics
///
/// Used for fee tier determination:
/// - Unverified creators: 0.3% fee
/// - Verified creators (≥1 graduation): 0.5% fee
///
/// PDA seeds: [b"creator_stats", creator.key().as_ref()]
#[account]
#[derive(InitSpace)]
pub struct CreatorStats {
    /// The creator's wallet address
    pub creator: Pubkey,

    /// Number of graduated launches by this creator
    pub graduated_count: u64,

    /// Total fees earned across all launches (lifetime)
    pub total_fees_earned: u64,

    /// Total launches created (graduated or not)
    pub total_launches: u64,

    /// Bump for PDA derivation
    pub bump: u8,
}

impl CreatorStats {
    /// Check if creator is verified (has at least one graduation)
    pub fn is_verified(&self) -> bool {
        self.graduated_count > 0
    }

    /// Get creator fee rate in basis points
    pub fn get_creator_fee_bps(&self) -> u64 {
        if self.is_verified() {
            crate::constants::CREATOR_FEE_VERIFIED_BPS // 50 bps = 0.5%
        } else {
            crate::constants::CREATOR_FEE_UNVERIFIED_BPS // 30 bps = 0.3%
        }
    }

    /// Record a new launch creation
    pub fn record_launch(&mut self) {
        self.total_launches += 1;
    }

    /// Record a graduation
    pub fn record_graduation(&mut self) {
        self.graduated_count += 1;
    }

    /// Record fees earned
    pub fn record_fees(&mut self, amount: u64) {
        self.total_fees_earned += amount;
    }
}
