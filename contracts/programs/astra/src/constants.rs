//! Protocol Constants - V7
//!
//! All hardcoded values for the Astra Protocol V7.
//! KEY CHANGE: All monetary values are in USD, converted to SOL at runtime.
//! This protects users from SOL price volatility and provides stable economics.
//!
//! Philosophy: Immutability IS the feature. Hardcoded parameters mean users
//! can verify exactly what they're getting by reading the deployed program.

// ============================================================================
// USD-BASED CONFIGURATION (V7 KEY FEATURE)
// ============================================================================

/// Graduation market cap threshold in USD ($42,000)
/// WHY: Stable target regardless of SOL price fluctuations
/// At $200/SOL = ~210 SOL, at $400/SOL = ~105 SOL
pub const GRADUATION_MARKET_CAP_USD: u64 = 42_000;

/// Minimum seed amount in USD ($40)
/// WHY: Accessible entry point for creators, adjusted for SOL price
/// At $200/SOL = 0.2 SOL, at $400/SOL = 0.1 SOL
pub const MIN_SEED_USD: u64 = 40;

/// Maximum seed amount in USD ($20,000)
/// WHY: Prevents creators from dominating launches while allowing meaningful investment
/// At $200/SOL = 100 SOL, at $400/SOL = 50 SOL
pub const MAX_SEED_USD: u64 = 20_000;

/// Buy preset amounts in USD (for frontend buttons)
/// WHY: Users think in USD, not SOL. Common purchase amounts.
/// These are converted to SOL at current price for transactions.
pub const BUY_PRESETS_USD: [u64; 6] = [5, 10, 25, 50, 100, 250];

// ============================================================================
// TOKEN SUPPLY (NO SHARE CAP - DYNAMIC ISSUANCE)
// ============================================================================

/// Tokens allocated to holders at graduation (800 million)
/// WHY: Fixed allocation that gets distributed proportionally to all share holders.
/// If 400M shares issued at graduation, each share gets 2 tokens.
/// If 800M shares issued at graduation, each share gets 1 token.
pub const TOKENS_FOR_HOLDERS: u64 = 800_000_000;

/// Tokens allocated to LP pool at graduation (200 million)
/// WHY: 20% of total supply for liquidity. Created fresh at graduation,
/// never existed as shares. Paired with all accumulated SOL.
pub const TOKENS_FOR_LP: u64 = 200_000_000;

/// Total token supply minted at graduation (1 billion)
/// WHY: Standard memecoin supply. 800M to holders + 200M to LP = 1B total.
pub const TOTAL_SUPPLY: u64 = 1_000_000_000;

/// Total supply with decimals (1B * 10^9)
/// Used for minting calculations
pub const TOTAL_SUPPLY_WITH_DECIMALS: u64 = 1_000_000_000_000_000_000;

// ============================================================================
// FEES
// ============================================================================

/// Total fee on buy transactions (1%)
/// WHY: Low enough to not discourage trading, high enough to sustain protocol
/// Split between creator and protocol based on verification status
pub const TOTAL_FEE_BPS: u64 = 100; // 1.0%

/// Creator's share of fees when unverified (0.3%)
/// WHY: Lower rate incentivizes graduation to get verified status
pub const CREATOR_FEE_UNVERIFIED_BPS: u64 = 30; // 0.3%

/// Creator's share of fees when verified (0.5%)
/// WHY: Reward for successful track record, still leaves protocol sustainable
pub const CREATOR_FEE_VERIFIED_BPS: u64 = 50; // 0.5%

/// Fee on sell transactions (0%)
/// WHY: Core promise of the protocol - free exits prevent rug dynamics
/// Users can always exit at their proportional basis without penalty
pub const SELL_FEE_BPS: u64 = 0;

// ============================================================================
// TIME WINDOWS
// ============================================================================

/// Vesting duration for creator shares (42 days)
/// WHY: Prevents creator from dumping immediately after graduation
/// 42 days = ~6 weeks, long enough to prove commitment
pub const VESTING_DURATION_SECONDS: i64 = 42 * 24 * 60 * 60; // 3,628,800 seconds

/// Launch duration before refund mode can be enabled (7 days)
/// WHY: Gives launches fair time to reach graduation
/// After 7 days, if not graduated, users can get refunds
pub const LAUNCH_DURATION_SECONDS: i64 = 7 * 24 * 60 * 60; // 604,800 seconds

// ============================================================================
// TRANSACTION LIMITS
// ============================================================================

/// Maximum buy amount per transaction (1000 SOL)
/// WHY: Whale protection - prevents single actors from dominating launches
/// Large buyers must spread across multiple transactions
pub const MAX_BUY_LAMPORTS: u64 = 1_000_000_000_000; // 1000 SOL

/// Maximum buy amount in USD (for reference, ~$200K at $200/SOL)
/// WHY: Documenting the USD equivalent for clarity
pub const MAX_BUY_USD: u64 = 200_000;

// ============================================================================
// GRADUATION THRESHOLDS (OFF-CHAIN ENFORCEMENT)
// ============================================================================

/// Minimum holder count for graduation
/// WHY: Ensures distribution, prevents single-actor graduations
/// ENFORCED: Off-chain by cron job
pub const GRADUATION_MIN_HOLDERS: u64 = 100;

/// Maximum concentration allowed for graduation (10%)
/// WHY: Prevents whale-dominated graduations
/// No single address can hold more than 10% of shares
/// ENFORCED: Off-chain by cron job
pub const GRADUATION_MAX_CONCENTRATION_BPS: u64 = 1000; // 10%

/// Market cap threshold notification trigger (95% of target)
/// WHY: Alert frontend/cron that graduation is approaching
pub const GRADUATION_THRESHOLD_NOTIFICATION_BPS: u64 = 9500; // 95%

// ============================================================================
// BASIS POINTS HELPERS
// ============================================================================

/// Basis points denominator (100% = 10000 bps)
pub const BPS_DENOMINATOR: u64 = 10_000;

// ============================================================================
// PRICE ORACLE CONFIGURATION
// ============================================================================

/// Pyth price feed ID for SOL/USD on Solana mainnet
/// WHY: Primary price source for USD conversions
pub const PYTH_SOL_USD_FEED: &str = "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG";

/// Maximum acceptable price staleness (5 minutes)
/// WHY: Protect against using stale prices during volatility
pub const MAX_PRICE_STALENESS_SECONDS: i64 = 300;

/// Fallback price update interval (1 minute)
/// WHY: Cache price for fallback when Pyth unavailable
pub const PRICE_CACHE_UPDATE_INTERVAL_SECONDS: i64 = 60;

// ============================================================================
// BONDING CURVE PARAMETERS
// ============================================================================

/// Bonding curve slope constant
/// Formula: Cost = (CURVE_SLOPE / 2) × (S_new² - S_current²) / CURVE_SCALE
///
/// CALIBRATION NOTES:
/// - Curve is quadratic: price increases linearly with supply
/// - Early buyers get more shares per SOL (better price)
/// - Late buyers get fewer shares per SOL (higher price)
/// - At $42K market cap, total shares issued depends on SOL price:
///   * SOL=$100: ~735M shares issued
///   * SOL=$200: ~520M shares issued  
///   * SOL=$400: ~367M shares issued
///
/// The curve ensures fair price discovery while guaranteeing $42K USD target
/// is the graduation trigger, not a fixed share count.
pub const CURVE_SLOPE: u128 = 781_250;
pub const CURVE_SCALE: u128 = 1_000_000_000_000;

// ============================================================================
// CONFIGURABLE VALUES (VIA GLOBAL CONFIG)
// ============================================================================
// The following are intentionally configurable via GlobalConfig because they
// need operational flexibility while not affecting economic guarantees:
//
// - min_seed_lamports: Calculated from MIN_SEED_USD at current SOL price
// - authority: Admin key, needs rotation capability
// - operator_wallet: Janitor wallet, needs rotation capability
// - protocol_fee_wallet: Treasury address, needs update capability
// - paused: Emergency stop, must be toggleable
// - sol_price_usd: Cached SOL price for USD conversions
