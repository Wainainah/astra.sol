use anchor_lang::prelude::*;

/// Global configuration account - protocol-wide settings
///
/// PDA seeds: [b"config"]
/// Singleton account initialized once at protocol deployment
#[account]
#[derive(InitSpace)]
pub struct GlobalConfig {
    /// Protocol admin who can update config
    pub authority: Pubkey,

    /// Operator wallet that can call graduate()
    pub operator_wallet: Pubkey,

    /// Wallet receiving protocol fees (0.5-0.7% on buys)
    pub protocol_fee_wallet: Pubkey,

    /// Wallet receiving vault protocol share (10% of yield)
    pub vault_protocol_wallet: Pubkey,

    /// Minimum seed in lamports (calculated from MIN_SEED_USD at current SOL price)
    /// Updated periodically via oracle
    pub min_seed_lamports: u64,

    /// Current SOL price in USD (for runtime conversions)
    /// Updated by GitHub Actions cron job every minute
    pub sol_price_usd: u64,

    /// Last price update timestamp
    pub price_last_updated: i64,

    /// Is protocol paused? (emergency stop)
    pub paused: bool,

    /// Total launches created (for stats)
    pub total_launches: u64,

    /// Bump for PDA derivation
    pub bump: u8,
}

impl GlobalConfig {
    /// Calculate lamports from USD amount
    pub fn usd_to_lamports(&self, usd_amount: u64) -> Option<u64> {
        if self.sol_price_usd == 0 {
            return None;
        }

        // lamports = (USD / price) * 1B (lamports per SOL)
        let lamports = (usd_amount as u128)
            .checked_mul(1_000_000_000)?
            .checked_div(self.sol_price_usd as u128)?;

        Some(lamports as u64)
    }

    /// Calculate USD from lamports
    pub fn lamports_to_usd(&self, lamports: u64) -> Option<u64> {
        // USD = (lamports * price) / 1B
        let usd = (lamports as u128)
            .checked_mul(self.sol_price_usd as u128)?
            .checked_div(1_000_000_000)?;

        Some(usd as u64)
    }

    /// Check if price is stale (>5 minutes old)
    pub fn is_price_stale(&self, current_time: i64) -> bool {
        current_time - self.price_last_updated > 300 // 5 minutes
    }
}
