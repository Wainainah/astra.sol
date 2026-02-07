/**
 * V7 Bonding Curve Calculations
 * 
 * Frontend mirror of the on-chain curve math.
 * Used for calculating position values, market cap, and graduation estimates.
 */

import { CURVE_SLOPE, CURVE_SCALE, TOKENS_FOR_HOLDERS, GRADUATION_MARKET_CAP_USD } from "./constants";

// ============================================================================
// CORE CURVE MATH (Mirror of on-chain)
// ============================================================================

/**
 * Calculate cost to buy shares (mirror of buy_quote)
 * Cost = (slope / 2) * (S_new² - S_current²) / scale
 */
export function buyQuote(sharesOut: number, currentSupply: number): number {
  if (sharesOut === 0) return 0;

  const sCurrent = BigInt(currentSupply);
  const sNew = sCurrent + BigInt(sharesOut);

  const sNewSq = sNew * sNew;
  const sCurrSq = sCurrent * sCurrent;
  const deltaSq = sNewSq - sCurrSq;

  const numerator = BigInt(CURVE_SLOPE) * deltaSq;
  const denominator = BigInt(2) * BigInt(CURVE_SCALE);

  return Number(numerator / denominator);
}

/**
 * Calculate shares received for SOL amount (mirror of buy_return)
 * s_new = sqrt((2 * cost * scale / slope) + s_current²)
 */
export function buyReturn(solAmount: number, currentSupply: number): number {
  if (solAmount === 0) return 0;

  const cost = BigInt(solAmount);
  const sCurrent = BigInt(currentSupply);

  const term1 = (BigInt(2) * cost * BigInt(CURVE_SCALE)) / BigInt(CURVE_SLOPE);
  const sCurrSq = sCurrent * sCurrent;
  const insideSqrt = term1 + sCurrSq;

  const sNew = integerSqrt(insideSqrt);
  return Number(sNew - sCurrent);
}

/**
 * Calculate proportional refund for selling shares (mirror of sell_return)
 * refund = sharesToSell * userBasis / userShares
 */
export function sellReturn(
  sharesToSell: number,
  userShares: number,
  userBasis: number
): number {
  if (sharesToSell === 0) return 0;
  if (userShares === 0) return 0;

  return Math.floor((sharesToSell * userBasis) / userShares);
}

/**
 * Integer square root using Newton's method
 */
function integerSqrt(n: bigint): bigint {
  if (n < BigInt(2)) return n;

  // Initial guess
  const shift = BigInt(Math.max(0, Math.floor((n.toString().length * Math.log2(10)) / 2)));
  let x = BigInt(1) << shift;

  while (true) {
    const y = (x + n / x) / BigInt(2);
    if (y >= x) return x;
    x = y;
  }
}

// ============================================================================
// V7: POSITION VALUE CALCULATIONS
// ============================================================================

/**
 * Calculate current share price (what it costs to buy 1 share now)
 */
export function getSharePrice(totalShares: number): number {
  if (totalShares === 0) return 0;
  // Price = derivative of curve at current supply
  // Price per share = slope * supply / scale
  return Number((BigInt(CURVE_SLOPE) * BigInt(totalShares)) / BigInt(CURVE_SCALE));
}

/**
 * Calculate current market value of a position
 * (What it would cost to buy that position now)
 */
export function getPositionValue(shares: number, currentTotalShares: number): number {
  if (shares === 0 || currentTotalShares === 0) return 0;
  
  // What would it cost to buy these shares at current prices?
  return buyQuote(shares, currentTotalShares - shares);
}

/**
 * Calculate market cap in lamports
 */
export function getMarketCapLamports(totalSol: number): number {
  return totalSol;
}

/**
 * Calculate market cap in USD
 */
export function getMarketCapUsd(totalSol: number, solPriceUsd: number): number {
  return (totalSol * solPriceUsd) / 1e9; // Convert lamports to SOL then to USD
}

/**
 * Calculate graduation progress (0-100%)
 */
export function getGraduationProgress(marketCapUsd: number): number {
  return Math.min(100, (marketCapUsd / GRADUATION_MARKET_CAP_USD) * 100);
}

// ============================================================================
// V7: TOKEN DISTRIBUTION CALCULATIONS
// ============================================================================

/**
 * Calculate ownership percentage
 */
export function getOwnershipPercent(shares: number, totalShares: number): number {
  if (totalShares === 0) return 0;
  return (shares / totalShares) * 100;
}

/**
 * Estimate tokens received at graduation
 * tokens = (userShares / totalSharesAtGraduation) * TOKENS_FOR_HOLDERS
 */
export function estimateTokensAtGraduation(
  userShares: number,
  totalSharesAtGraduation: number
): number {
  if (totalSharesAtGraduation === 0) return 0;
  return (userShares / totalSharesAtGraduation) * TOKENS_FOR_HOLDERS;
}

/**
 * Calculate estimated token value at graduation
 * Assuming 1B total supply with 200M in LP at ~$42K market cap
 */
export function estimateTokenValueAtGraduation(): number {
  // Very rough estimate: $42K / 1B tokens = $0.000042 per token
  // But actual value depends on liquidity and trading
  // Return a conservative estimate
  return 0.00005; // $0.00005 per token
}

// ============================================================================
// V7: SELL WARNINGS
// ============================================================================

export interface SellWarning {
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  leavingBehindSol: number;
  leavingBehindUsd: number;
}

/**
 * Generate warning for selling position
 */
export function getSellWarning(
  sharesToSell: number,
  userShares: number,
  userBasis: number,
  currentTotalShares: number,
  solPriceUsd: number
): SellWarning | null {
  if (sharesToSell === 0) return null;

  const positionValue = getPositionValue(userShares, currentTotalShares);
  const refundAmount = sellReturn(sharesToSell, userShares, userBasis);
  const leavingBehind = positionValue - refundAmount;
  const leavingBehindUsd = (leavingBehind * solPriceUsd) / 1e9;

  if (leavingBehind <= 0) {
    return {
      severity: "info",
      title: "Break Even",
      message: "You're selling at approximately your entry price.",
      leavingBehindSol: 0,
      leavingBehindUsd: 0,
    };
  }

  const roi = ((positionValue - userBasis) / userBasis) * 100;

  if (roi > 50) {
    return {
      severity: "critical",
      title: "Leaving Significant Gains",
      message: `Your position is up ${roi.toFixed(0)}%. Selling now means leaving $${leavingBehindUsd.toFixed(2)} of gains on the table. Hold until graduation to capture the full value!`,
      leavingBehindSol: leavingBehind / 1e9,
      leavingBehindUsd,
    };
  }

  if (roi > 10) {
    return {
      severity: "warning",
      title: "Leaving Money on the Table",
      message: `You're leaving $${leavingBehindUsd.toFixed(2)} of unrealized gains behind. Consider holding until graduation.`,
      leavingBehindSol: leavingBehind / 1e9,
      leavingBehindUsd,
    };
  }

  return {
    severity: "info",
    title: "Early Exit",
    message: "You're selling before graduation. You won't capture any upside from the bonding curve.",
    leavingBehindSol: leavingBehind / 1e9,
    leavingBehindUsd,
  };
}

// ============================================================================
// V7: QUOTE HELPERS
// ============================================================================

export interface BuyQuoteResult {
  solAmount: number;
  sharesOut: number;
  pricePerShare: number;
  pricePerShareUsd: number;
  marketCapAfter: number;
  marketCapAfterUsd: number;
  graduationProgressAfter: number;
  ownershipPercentAfter: number;
}

/**
 * Get comprehensive buy quote
 */
export function getBuyQuote(
  solAmount: number,
  currentTotalShares: number,
  currentUserShares: number,
  solPriceUsd: number
): BuyQuoteResult {
  const sharesOut = buyReturn(solAmount, currentTotalShares);
  const newTotalShares = currentTotalShares + sharesOut;
  const newUserShares = currentUserShares + sharesOut;
  
  const pricePerShare = sharesOut > 0 ? solAmount / sharesOut : 0;
  const pricePerShareUsd = (pricePerShare * solPriceUsd) / 1e9;
  
  const marketCapAfter = getMarketCapLamports(newTotalShares * pricePerShare);
  const marketCapAfterUsd = getMarketCapUsd(marketCapAfter, solPriceUsd);
  
  return {
    solAmount,
    sharesOut,
    pricePerShare,
    pricePerShareUsd,
    marketCapAfter,
    marketCapAfterUsd,
    graduationProgressAfter: getGraduationProgress(marketCapAfterUsd),
    ownershipPercentAfter: getOwnershipPercent(newUserShares, newTotalShares),
  };
}

export interface SellQuoteResult {
  sharesToSell: number;
  refundAmount: number;
  refundAmountUsd: number;
  leavingBehind: number;
  leavingBehindUsd: number;
  warning: SellWarning | null;
}

/**
 * Get comprehensive sell quote
 */
export function getSellQuote(
  sharesToSell: number,
  userShares: number,
  userBasis: number,
  currentTotalShares: number,
  solPriceUsd: number
): SellQuoteResult {
  const refundAmount = sellReturn(sharesToSell, userShares, userBasis);
  const positionValue = getPositionValue(userShares, currentTotalShares);
  const leavingBehind = Math.max(0, positionValue - refundAmount);
  
  const warning = getSellWarning(
    sharesToSell,
    userShares,
    userBasis,
    currentTotalShares,
    solPriceUsd
  );

  return {
    sharesToSell,
    refundAmount,
    refundAmountUsd: (refundAmount * solPriceUsd) / 1e9,
    leavingBehind,
    leavingBehindUsd: (leavingBehind * solPriceUsd) / 1e9,
    warning,
  };
}
