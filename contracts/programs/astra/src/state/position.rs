use anchor_lang::prelude::*;

/// User position account - tracks shares and basis for a user in a launch
///
/// V7 SIMPLIFICATION:
/// - Removed 92/8 split complexity
/// - All shares are unlocked (100% sellable)
/// - Single shares and basis tracking
/// - Creator vesting uses separate locked_shares field
#[account]
#[derive(InitSpace)]
pub struct Position {
    /// The launch this position is for
    pub launch: Pubkey,

    /// The user who owns this position
    pub user: Pubkey,

    /// ------ SHARE TRACKING (V7 SIMPLIFIED) ------
    /// Total shares owned (100% unlocked)
    /// All shares can be sold pre-graduation
    pub shares: u64,

    /// SOL deposited for these shares (basis for refunds)
    pub sol_basis: u64,

    /// ------ CREATOR VESTING ------
    /// Locked shares (only for creator seed)
    /// These vest over 42 days post-graduation
    pub locked_shares: u64,

    /// Shares already claimed via vesting
    pub vested_shares_claimed: u64,

    /// ------ CLAIM TRACKING ------
    /// Whether user has claimed their tokens post-graduation
    pub has_claimed_tokens: bool,

    /// Whether user has claimed their refund (if launch failed)
    pub has_claimed_refund: bool,

    /// ------ TIMESTAMPS ------
    /// When user first bought into this launch
    pub first_buy_at: i64,

    /// Last activity timestamp
    pub last_updated_at: i64,

    /// Bump for PDA derivation
    pub bump: u8,
}

impl Position {
    /// Get sellable shares (unlocked only)
    pub fn sellable_shares(&self) -> u64 {
        self.shares
    }

    /// Calculate proportional refund for selling shares
    pub fn calculate_refund(&self, shares_to_sell: u64) -> Option<u64> {
        if self.shares == 0 || shares_to_sell > self.shares {
            return None;
        }

        // Proportional refund: (shares_to_sell / total_shares) * basis
        let refund = (shares_to_sell as u128)
            .checked_mul(self.sol_basis as u128)?
            .checked_div(self.shares as u128)?;

        Some(refund as u64)
    }

    /// Check if this is the creator's position
    pub fn is_creator(&self, creator: &Pubkey) -> bool {
        self.user == *creator
    }

    /// Get unlocked shares (available for claiming tokens)
    /// For regular users: all shares
    /// For creator: shares minus locked portion
    pub fn unlocked_shares(&self, is_creator: bool) -> u64 {
        if is_creator {
            self.shares.saturating_sub(self.locked_shares)
        } else {
            self.shares
        }
    }
}
