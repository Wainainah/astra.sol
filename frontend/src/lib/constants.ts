/**
 * V7 Frontend Constants
 * 
 * Mirrors the on-chain constants for calculations
 */

// USD Configuration
export const GRADUATION_MARKET_CAP_USD = 42_000;
export const MIN_SEED_USD = 40;
export const MAX_SEED_USD = 20_000;

// Buy presets
export const BUY_PRESETS_USD = [5, 10, 25, 50, 100, 250];

// Token Supply
export const TOKENS_FOR_HOLDERS = 800_000_000;
export const TOKENS_FOR_LP = 200_000_000;
export const TOTAL_SUPPLY = 1_000_000_000;

// Graduation Gates
export const GRADUATION_MIN_HOLDERS = 100;
export const GRADUATION_MAX_CONCENTRATION_BPS = 1000; // 10%
export const GRADUATION_THRESHOLD_NOTIFICATION_BPS = 9500; // 95%

// Fees
export const TOTAL_FEE_BPS = 100; // 1%
export const CREATOR_FEE_UNVERIFIED_BPS = 30; // 0.3%
export const CREATOR_FEE_VERIFIED_BPS = 50; // 0.5%

// Bonding Curve Parameters
export const CURVE_SLOPE = 781_250;
export const CURVE_SCALE = 1_000_000_000_000;

// Time Windows
export const VESTING_DURATION_SECONDS = 42 * 24 * 60 * 60; // 42 days
export const LAUNCH_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days
export const VESTING_DAYS = 42;
export const VESTING_RATE_BPS = 238; // ~2.38% per day (10000 / 42)

// Basis Points
export const BPS_DENOMINATOR = 10_000;

// Transaction Limits
export const MAX_BUY_LAMPORTS = 1_000_000_000_000; // 1000 SOL
export const MAX_BUY_USD = 200_000;

// Address utilities
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
