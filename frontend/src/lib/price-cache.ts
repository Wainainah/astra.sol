/**
 * SOL Price Cache
 * 
 * Caches SOL price in USD with periodic updates.
 * Used for converting lamports to USD values.
 */

import { GRADUATION_MARKET_CAP_USD } from "./constants";

interface PriceCache {
  price: number;
  lastUpdated: number;
}

let priceCache: PriceCache | null = null;
const CACHE_DURATION_MS = 60 * 1000; // 1 minute cache

/**
 * Get cached SOL price, fetch if expired
 */
export async function getSolPriceUsd(): Promise<number> {
  const now = Date.now();
  
  if (priceCache && now - priceCache.lastUpdated < CACHE_DURATION_MS) {
    return priceCache.price;
  }
  
  // Fetch new price
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      { next: { revalidate: 60 } }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch SOL price: ${response.status}`);
    }
    
    const data = await response.json();
    const price = data.solana?.usd ?? 0;
    
    priceCache = {
      price,
      lastUpdated: now,
    };
    
    return price;
  } catch (error) {
    console.error("Error fetching SOL price:", error);
    // Return cached price or fallback
    return priceCache?.price ?? 100; // Fallback to $100
  }
}

/**
 * Get SOL price synchronously (may be stale)
 */
export function getSolPriceUsdSync(): number {
  return priceCache?.price ?? 100;
}

/**
 * Convert lamports to USD
 */
export function lamportsToUsd(lamports: number | bigint, solPriceUsd: number): number {
  const lamportsNum = typeof lamports === "bigint" ? Number(lamports) : lamports;
  return (lamportsNum * solPriceUsd) / 1e9;
}

/**
 * Calculate market cap in USD from total SOL
 */
export function calculateMarketCapUsd(totalSolLamports: number | bigint, solPriceUsd: number): number {
  const totalSol = typeof totalSolLamports === "bigint" ? Number(totalSolLamports) : totalSolLamports;
  return (totalSol * solPriceUsd) / 1e9;
}

/**
 * Calculate graduation progress percentage
 */
export function calculateGraduationProgress(marketCapUsd: number): number {
  return Math.min(100, (marketCapUsd / GRADUATION_MARKET_CAP_USD) * 100);
}
