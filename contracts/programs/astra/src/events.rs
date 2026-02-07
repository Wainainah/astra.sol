use anchor_lang::prelude::*;

#[event]
pub struct ConfigInitialized {
    pub authority: Pubkey,
    pub min_seed_lamports: u64,
}

#[event]
pub struct LaunchCreated {
    pub launch_id: u64,
    pub creator: Pubkey,
    pub name: String,
    pub symbol: String,
    pub seed_lamports: u64,
    pub seed_shares: u64,
    pub timestamp: i64,
}

#[event]
pub struct SharesPurchased {
    pub launch: Pubkey,
    pub buyer: Pubkey,
    pub sol_amount: u64,
    pub shares_received: u64,
    pub is_seed_buy: bool,
    pub timestamp: i64,
}

#[event]
pub struct SharesSold {
    pub launch: Pubkey,
    pub seller: Pubkey,
    pub shares_sold: u64,
    pub sol_refunded: u64,
    pub timestamp: i64,
}

#[event]
pub struct Graduated {
    pub launch: Pubkey,
    pub token_mint: Pubkey,
    pub pool_address: Pubkey,
    pub lp_mint: Pubkey,
    pub sol_for_lp: u64,
    pub total_shares: u64,
    pub timestamp: i64,
}

#[event]
pub struct RefundEnabled {
    pub launch: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct RefundClaimed {
    pub launch: Pubkey,
    pub user: Pubkey,
    pub sol_refunded: u64,
    pub timestamp: i64,
}

#[event]
pub struct TokensClaimed {
    pub launch: Pubkey,
    pub user: Pubkey,
    pub tokens_claimed: u64,
    pub timestamp: i64,
}

#[event]
pub struct VestingClaimed {
    pub launch: Pubkey,
    pub user: Pubkey,
    pub shares_unlocked: u64,
    pub remaining_locked: u64,
    pub timestamp: i64,
}

#[event]
pub struct CreatorFeesClaimed {
    pub launch: Pubkey,
    pub creator: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct RefundPushed {
    pub launch: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct Poked {
    pub vault: Pubkey,
    pub caller: Pubkey,
    pub total_yield: u64,
    pub caller_reward: u64,
    pub creator_reward: u64,
    pub protocol_reward: u64,
    pub compounded: u64,
    pub timestamp: i64,
}

#[event]
pub struct LaunchClosed {
    pub launch: Pubkey,
    pub caller: Pubkey,
    pub timestamp: i64,
}

// V7 EVENTS - Dynamic Share Issuance

/// Emitted when market cap is updated after a buy
/// Used by frontend and cron jobs to track graduation progress
#[event]
pub struct MarketCapUpdated {
    pub launch: Pubkey,
    pub market_cap_usd: u64,
    pub total_shares: u64,
    pub total_sol: u64,
    pub timestamp: i64,
}

/// Emitted when launch approaches graduation threshold (95% of target)
/// Signals cron job to check graduation gates
#[event]
pub struct ReadyToGraduate {
    pub launch: Pubkey,
    pub market_cap_usd: u64,
    pub threshold_usd: u64,
    pub timestamp: i64,
}

/// Emitted when price oracle is updated
#[event]
pub struct PriceUpdated {
    pub sol_price_usd: u64,
    pub timestamp: i64,
}
