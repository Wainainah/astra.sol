"use client";

/**
 * useSolPrice Hook - Astra Protocol V7
 * 
 * Fetches current SOL price in USD and provides conversion utilities
 */

import { useState, useEffect, useCallback, useMemo } from "react";

const FALLBACK_PRICE = 100; // $100 USD fallback
const CACHE_DURATION_MS = 60 * 1000; // 1 minute cache

interface SolPriceData {
  price: number;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

// Global cache
let cachedPrice: number | null = null;
let cachedAt: number = 0;

export function useSolPrice(): SolPriceData & {
  toUsd: (solAmount: number) => number;
  toSol: (usdAmount: number) => number;
  refresh: () => Promise<void>;
} {
  const [price, setPrice] = useState<number>(cachedPrice || FALLBACK_PRICE);
  const [isLoading, setIsLoading] = useState(!cachedPrice);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(
    cachedPrice ? new Date(cachedAt) : null
  );

  const fetchPrice = useCallback(async () => {
    // Return cached price if fresh
    const now = Date.now();
    if (cachedPrice && now - cachedAt < CACHE_DURATION_MS) {
      setPrice(cachedPrice);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to fetch from CoinGecko
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch SOL price");
      }

      const data = await response.json();
      const solPrice = data.solana?.usd;

      if (solPrice && solPrice > 0) {
        cachedPrice = solPrice;
        cachedAt = now;
        setPrice(solPrice);
        setLastUpdated(new Date());
      } else {
        throw new Error("Invalid price data");
      }
    } catch (err) {
      console.warn("Failed to fetch SOL price, using fallback:", err);
      // Use cached price or fallback
      if (!cachedPrice) {
        cachedPrice = FALLBACK_PRICE;
      }
      setPrice(cachedPrice);
      setError(err instanceof Error ? err : new Error("Failed to fetch price"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Conversion utilities
  const toUsd = useCallback(
    (solAmount: number): number => {
      return solAmount * price;
    },
    [price]
  );

  const toSol = useCallback(
    (usdAmount: number): number => {
      return usdAmount / price;
    },
    [price]
  );

  // Fetch on mount
  useEffect(() => {
    fetchPrice();

    // Refresh every 5 minutes
    const interval = setInterval(fetchPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return {
    price,
    isLoading,
    error,
    lastUpdated,
    toUsd,
    toSol,
    refresh: fetchPrice,
  };
}
