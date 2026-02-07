/**
 * useTokenPrice Hook - Astra Protocol V7
 * 
 * Fetches and calculates current token metrics:
 * - Share price (current cost to buy 1 share)
 * - Market cap in USD
 * - Graduation progress (0-100%)
 * - Holder stats
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { getSharePrice, getMarketCapUsd, getGraduationProgress } from "@/lib/curve";
import { GRADUATION_MARKET_CAP_USD } from "@/lib/constants";
import type { Token, TokenPrice, Launch } from "@/lib/api-types";

export interface UseTokenPriceOptions {
  refreshInterval?: number; // Milliseconds, default 5000 (5s)
  autoRefresh?: boolean;
}

export interface UseTokenPriceResult {
  // Price data
  price: TokenPrice | null;
  
  // Loading states
  isLoading: boolean;
  error: Error | null;
  
  // Last updated
  lastUpdated: Date | null;
  
  // Manual refresh
  refresh: () => Promise<void>;
}

/**
 * Hook to get current token price and metrics
 * Can work with either a Token object or fetch from API
 */
export function useTokenPrice(
  tokenAddress: string,
  options: UseTokenPriceOptions = {}
): UseTokenPriceResult {
  const { refreshInterval = 5000, autoRefresh = true } = options;

  const [price, setPrice] = useState<TokenPrice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  /**
   * Fetch token price data from API
   */
  const fetchPrice = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tokens/${tokenAddress}/price`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch price: ${response.statusText}`);
      }

      const data: TokenPrice = await response.json();
      setPrice(data);
      setLastUpdated(new Date());
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch price");
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(async () => {
    await fetchPrice();
  }, [fetchPrice]);

  // Auto-refresh on mount and interval
  useEffect(() => {
    fetchPrice();

    if (!autoRefresh) return;

    const interval = setInterval(fetchPrice, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchPrice, refreshInterval, autoRefresh]);

  return {
    price,
    isLoading,
    error,
    lastUpdated,
    refresh,
  };
}

/**
 * Hook to calculate token price from launch data (no API call needed)
 * Use this when you already have the launch data
 */
export function useTokenPriceFromLaunch(
  launch: Launch | null | undefined,
  solPriceUsd: number
): TokenPrice | null {
  return useMemo(() => {
    if (!launch) return null;

    const sharePrice = getSharePrice(launch.totalShares);
    const marketCapUsd = getMarketCapUsd(launch.totalSol, solPriceUsd);
    const graduationProgress = getGraduationProgress(marketCapUsd);

    return {
      address: launch.address,
      sharePrice,
      sharePriceUsd: (sharePrice * solPriceUsd) / 1e9,
      marketCapUsd,
      graduationTarget: GRADUATION_MARKET_CAP_USD,
      graduationProgress,
      holders: launch.holders,
      topHolderPercent: launch.topHolderPct || 0,
      totalShares: launch.totalShares,
      totalSol: launch.totalSol,
      status: launch.status,
    };
  }, [launch, solPriceUsd]);
}

/**
 * Hook to calculate token price from token data (no API call needed)
 * Use this when you already have the token data from list view
 */
export function useTokenPriceFromToken(
  token: Token | null | undefined
): TokenPrice | null {
  return useMemo(() => {
    if (!token) return null;

    return {
      address: token.address,
      sharePrice: token.totalShares > 0 
        ? (token.totalSol / token.totalShares) 
        : 0,
      sharePriceUsd: token.marketCapUsd / Math.max(1, token.totalShares),
      marketCapUsd: token.marketCapUsd,
      graduationTarget: token.graduationTarget,
      graduationProgress: token.graduationProgress,
      holders: token.holders,
      topHolderPercent: token.topHolderPct || 0,
      totalShares: token.totalShares,
      totalSol: token.totalSol,
      status: token.status,
    };
  }, [token]);
}

/**
 * Hook to watch multiple token prices
 */
export function useTokenPrices(
  tokenAddresses: string[],
  options: UseTokenPriceOptions = {}
): {
  prices: Map<string, TokenPrice>;
  isLoading: boolean;
  errors: Map<string, Error>;
  refreshAll: () => Promise<void>;
  refreshOne: (address: string) => Promise<void>;
} {
  const { refreshInterval = 10000, autoRefresh = true } = options;

  const [prices, setPrices] = useState<Map<string, TokenPrice>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Map<string, Error>>(new Map());

  const fetchAll = useCallback(async () => {
    if (tokenAddresses.length === 0) return;

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/tokens/prices?addresses=${tokenAddresses.join(",")}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.statusText}`);
      }

      const data: TokenPrice[] = await response.json();
      const newPrices = new Map(prices);
      const newErrors = new Map(errors);

      for (const price of data) {
        newPrices.set(price.address, price);
        newErrors.delete(price.address);
      }

      setPrices(newPrices);
      setErrors(newErrors);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch prices");
      const newErrors = new Map(errors);
      for (const addr of tokenAddresses) {
        newErrors.set(addr, error);
      }
      setErrors(newErrors);
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddresses, prices, errors]);

  const refreshOne = useCallback(async (address: string) => {
    try {
      const response = await fetch(`/api/tokens/${address}/price`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch price: ${response.statusText}`);
      }

      const data: TokenPrice = await response.json();
      
      setPrices(prev => {
        const newPrices = new Map(prev);
        newPrices.set(address, data);
        return newPrices;
      });
      
      setErrors(prev => {
        const newErrors = new Map(prev);
        newErrors.delete(address);
        return newErrors;
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch price");
      setErrors(prev => {
        const newErrors = new Map(prev);
        newErrors.set(address, error);
        return newErrors;
      });
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await fetchAll();
  }, [fetchAll]);

  // Auto-refresh
  useEffect(() => {
    fetchAll();

    if (!autoRefresh) return;

    const interval = setInterval(fetchAll, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAll, refreshInterval, autoRefresh]);

  return {
    prices,
    isLoading,
    errors,
    refreshAll,
    refreshOne,
  };
}
