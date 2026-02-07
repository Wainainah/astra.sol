/**
 * useGraduationGates Hook - Astra Protocol V7
 * 
 * Checks graduation eligibility based on:
 * - Market cap ($42K USD target)
 * - Minimum holders (100)
 * - Maximum concentration (10% top holder)
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { checkGraduationGates, getGraduationStatus } from "@/lib/graduation-gates";
import { GRADUATION_MARKET_CAP_USD } from "@/lib/constants";
import type { GraduationGates, Launch, Position } from "@/lib/api-types";

export interface UseGraduationGatesOptions {
  refreshInterval?: number; // Milliseconds, default 10000 (10s)
  autoRefresh?: boolean;
}

export interface UseGraduationGatesResult {
  // Gate status
  gates: GraduationGates | null;
  
  // UI-friendly status
  status: {
    status: "ready" | "approaching" | "not_ready";
    message: string;
    color: string;
  } | null;
  
  // Individual gate status
  marketCapMet: boolean;
  holdersMet: boolean;
  concentrationMet: boolean;
  
  // Progress
  marketCapProgress: number; // 0-100%
  holdersProgress: number; // 0-100%
  
  // Loading
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  refresh: () => Promise<void>;
  checkGates: (launch: Launch, holders: Position[]) => GraduationGates;
}

/**
 * Hook to check graduation gates for a token
 * Fetches holders data and checks all criteria
 */
export function useGraduationGates(
  tokenAddress: string,
  options: UseGraduationGatesOptions = {}
): UseGraduationGatesResult {
  const { refreshInterval = 10000, autoRefresh = true } = options;

  const [gates, setGates] = useState<GraduationGates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch launch data and holders, then check gates
   */
  const fetchAndCheckGates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch launch data
      const launchResponse = await fetch(`/api/tokens/${tokenAddress}`);
      if (!launchResponse.ok) {
        throw new Error(`Failed to fetch launch: ${launchResponse.statusText}`);
      }
      const launch: Launch = await launchResponse.json();

      // Fetch holders
      const holdersResponse = await fetch(`/api/tokens/${tokenAddress}/holders`);
      if (!holdersResponse.ok) {
        throw new Error(`Failed to fetch holders: ${holdersResponse.statusText}`);
      }
      const holdersData = await holdersResponse.json();
      const holders: Position[] = holdersData.holders || [];

      // Check gates
      const gatesResult = checkGraduationGates(launch, holders);
      setGates(gatesResult);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to check gates");
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress]);

  /**
   * Manual refresh
   */
  const refresh = useCallback(async () => {
    await fetchAndCheckGates();
  }, [fetchAndCheckGates]);

  /**
   * Check gates with provided data (no fetch)
   */
  const checkGates = useCallback((launch: Launch, holders: Position[]): GraduationGates => {
    const result = checkGraduationGates(launch, holders);
    setGates(result);
    return result;
  }, []);

  // Auto-refresh
  useEffect(() => {
    fetchAndCheckGates();

    if (!autoRefresh) return;

    const interval = setInterval(fetchAndCheckGates, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAndCheckGates, refreshInterval, autoRefresh]);

  // Calculate UI-friendly status
  const status = useMemo(() => {
    if (!gates) return null;
    return getGraduationStatus(gates);
  }, [gates]);

  // Individual gate status
  const marketCapMet = gates?.marketCapUsd >= gates?.marketCapTarget || false;
  const holdersMet = gates?.holders >= gates?.holdersTarget || false;
  const concentrationMet = gates?.concentration <= gates?.concentrationTarget || false;

  // Progress percentages
  const marketCapProgress = useMemo(() => {
    if (!gates) return 0;
    return Math.min(100, (gates.marketCapUsd / GRADUATION_MARKET_CAP_USD) * 100);
  }, [gates]);

  const holdersProgress = useMemo(() => {
    if (!gates) return 0;
    return Math.min(100, (gates.holders / gates.holdersTarget) * 100);
  }, [gates]);

  return {
    gates,
    status,
    marketCapMet,
    holdersMet,
    concentrationMet,
    marketCapProgress,
    holdersProgress,
    isLoading,
    error,
    refresh,
    checkGates,
  };
}

/**
 * Hook to check graduation gates from existing data (no API calls)
 * Use when you already have launch and holders data
 */
export function useGraduationGatesFromData(
  launch: Launch | null | undefined,
  holders: Position[] | null | undefined
): {
  gates: GraduationGates | null;
  status: {
    status: "ready" | "approaching" | "not_ready";
    message: string;
    color: string;
  } | null;
  canGraduate: boolean;
  blockingReasons: string[];
  progress: {
    marketCap: number;
    holders: number;
    concentration: number;
  };
} {
  const gates = useMemo(() => {
    if (!launch || !holders) return null;
    return checkGraduationGates(launch, holders);
  }, [launch, holders]);

  const status = useMemo(() => {
    if (!gates) return null;
    return getGraduationStatus(gates);
  }, [gates]);

  const progress = useMemo(() => {
    if (!gates) return { marketCap: 0, holders: 0, concentration: 0 };
    return {
      marketCap: Math.min(100, (gates.marketCapUsd / gates.marketCapTarget) * 100),
      holders: Math.min(100, (gates.holders / gates.holdersTarget) * 100),
      concentration: Math.min(100, (gates.concentration / gates.concentrationTarget) * 100),
    };
  }, [gates]);

  return {
    gates,
    status,
    canGraduate: gates?.canGraduate || false,
    blockingReasons: gates?.blockingReasons || [],
    progress,
  };
}

/**
 * Hook to watch graduation gates for multiple tokens
 */
export function useGraduationGatesBatch(
  tokenAddresses: string[],
  options: UseGraduationGatesOptions = {}
): {
  gates: Map<string, GraduationGates>;
  readyToGraduate: string[];
  approaching: string[];
  isLoading: boolean;
  errors: Map<string, Error>;
  refreshAll: () => Promise<void>;
  refreshOne: (address: string) => Promise<void>;
} {
  const { refreshInterval = 30000, autoRefresh = true } = options;

  const [gates, setGates] = useState<Map<string, GraduationGates>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Map<string, Error>>(new Map());

  const fetchAll = useCallback(async () => {
    if (tokenAddresses.length === 0) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/tokens/graduation-gates?addresses=${tokenAddresses.join(",")}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch gates: ${response.statusText}`);
      }

      const data: { address: string; gates: GraduationGates }[] = await response.json();
      const newGates = new Map(gates);
      const newErrors = new Map(errors);

      for (const item of data) {
        newGates.set(item.address, item.gates);
        newErrors.delete(item.address);
      }

      setGates(newGates);
      setErrors(newErrors);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch gates");
      const newErrors = new Map(errors);
      for (const addr of tokenAddresses) {
        newErrors.set(addr, error);
      }
      setErrors(newErrors);
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddresses, gates, errors]);

  const refreshOne = useCallback(async (address: string) => {
    try {
      const response = await fetch(`/api/tokens/${address}/graduation-gates`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch gates: ${response.statusText}`);
      }

      const data: GraduationGates = await response.json();
      
      setGates(prev => {
        const newGates = new Map(prev);
        newGates.set(address, data);
        return newGates;
      });
      
      setErrors(prev => {
        const newErrors = new Map(prev);
        newErrors.delete(address);
        return newErrors;
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch gates");
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

  // Derived lists
  const readyToGraduate = useMemo(() => {
    return Array.from(gates.entries())
      .filter(([, g]) => g.canGraduate)
      .map(([addr]) => addr);
  }, [gates]);

  const approaching = useMemo(() => {
    return Array.from(gates.entries())
      .filter(([, g]) => !g.canGraduate && g.marketCapUsd / g.marketCapTarget >= 0.75)
      .map(([addr]) => addr);
  }, [gates]);

  // Auto-refresh
  useEffect(() => {
    fetchAll();

    if (!autoRefresh) return;

    const interval = setInterval(fetchAll, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAll, refreshInterval, autoRefresh]);

  return {
    gates,
    readyToGraduate,
    approaching,
    isLoading,
    errors,
    refreshAll,
    refreshOne,
  };
}
