/**
 * usePositionValue Hook - Astra Protocol V7
 * 
 * Calculates real-time position value including:
 * - Current position value (what it costs to buy now)
 * - Unrealized gains (paper gains on the curve)
 * - ROI percentage
 * - Estimated tokens at graduation
 */

import { useMemo, useCallback } from "react";
import {
  getPositionValue,
  getSharePrice,
  getOwnershipPercent,
  estimateTokensAtGraduation,
  estimateTokenValueAtGraduation,
} from "@/lib/curve";
import { GRADUATION_MARKET_CAP_USD } from "@/lib/constants";
import type { Position, Launch, PositionValue } from "@/lib/api-types";

export interface UsePositionValueOptions {
  solPriceUsd: number;
}

export interface UsePositionValueResult {
  // Calculated value
  value: PositionValue | null;
  
  // Convenience accessors
  currentValueSol: number;
  currentValueUsd: number;
  unrealizedGainSol: number;
  unrealizedGainUsd: number;
  roiPercent: number;
  ownershipPercent: number;
  estimatedTokensAtGraduation: number;
  estimatedValueAtGraduationUsd: number;
  
  // Helpers
  isInProfit: boolean;
  isAtLoss: boolean;
  canGraduate: boolean;
  
  // Recalculate manually
  recalculate: () => PositionValue | null;
}

export function usePositionValue(
  position: Position | null | undefined,
  launch: Launch | null | undefined,
  options: UsePositionValueOptions
): UsePositionValueResult {
  const { solPriceUsd } = options;

  /**
   * Calculate the full position value breakdown
   */
  const calculateValue = useCallback((): PositionValue | null => {
    if (!position || !launch) return null;
    if (position.shares === 0) return null;

    const { shares, solBasis } = position;
    const { totalShares, totalSol, status } = launch;

    // Current share price
    const sharePrice = getSharePrice(totalShares);
    const sharePriceUsd = (sharePrice * solPriceUsd) / 1e9;

    // Current position value (what it would cost to buy now)
    const positionValue = getPositionValue(shares, totalShares);
    const positionValueUsd = (positionValue * solPriceUsd) / 1e9;

    // Original investment
    const invested = solBasis;
    const investedUsd = (invested * solPriceUsd) / 1e9;

    // Unrealized gains (paper gains)
    const unrealizedGain = positionValue - invested;
    const unrealizedGainUsd = positionValueUsd - investedUsd;

    // ROI percentage
    const roiPercent = invested > 0 ? (unrealizedGain / invested) * 100 : 0;

    // Ownership percentage
    const ownershipPercent = getOwnershipPercent(shares, totalShares);

    // Estimate tokens at graduation (only for active launches)
    let estimatedTokensAtGraduation = 0;
    let estimatedValueAtGraduation = 0;
    let estimatedValueAtGraduationUsd = 0;

    if (status === "active") {
      // Estimate total shares at graduation based on $42K market cap
      // Market cap = totalSol * solPriceUsd / 1e9
      // At graduation: totalSol = 42000 * 1e9 / solPriceUsd
      const estimatedTotalSolAtGrad =
        (GRADUATION_MARKET_CAP_USD * 1e9) / solPriceUsd;
      
      // Estimate total shares at graduation (rough approximation)
      // This assumes linear growth, actual calculation would use curve math
      const estimatedTotalSharesAtGrad = totalShares * (estimatedTotalSolAtGrad / Math.max(1, totalSol));

      estimatedTokensAtGraduation = estimateTokensAtGraduation(
        shares,
        estimatedTotalSharesAtGrad
      );

      const tokenValue = estimateTokenValueAtGraduation();
      estimatedValueAtGraduationUsd = estimatedTokensAtGraduation * tokenValue;
      estimatedValueAtGraduation = (estimatedValueAtGraduationUsd * 1e9) / solPriceUsd;
    }

    return {
      shares,
      sharePrice,
      sharePriceUsd,
      positionValue,
      positionValueUsd,
      invested,
      investedUsd,
      unrealizedGain,
      unrealizedGainUsd,
      roiPercent,
      ownershipPercent,
      estimatedTokensAtGraduation,
      estimatedValueAtGraduation,
      estimatedValueAtGraduationUsd,
    };
  }, [position, launch, solPriceUsd]);

  // Memoize the calculation
  const value = useMemo(() => calculateValue(), [calculateValue]);

  // Convenience accessors
  const currentValueSol = value?.positionValue ? value.positionValue / 1e9 : 0;
  const currentValueUsd = value?.positionValueUsd || 0;
  const unrealizedGainSol = value?.unrealizedGain ? value.unrealizedGain / 1e9 : 0;
  const unrealizedGainUsd = value?.unrealizedGainUsd || 0;
  const roiPercent = value?.roiPercent || 0;
  const ownershipPercent = value?.ownershipPercent || 0;
  const estimatedTokensAtGraduation = value?.estimatedTokensAtGraduation || 0;
  const estimatedValueAtGraduationUsd = value?.estimatedValueAtGraduationUsd || 0;

  // Derived states
  const isInProfit = (value?.unrealizedGain || 0) > 0;
  const isAtLoss = (value?.unrealizedGain || 0) < 0;
  const canGraduate = launch?.status === "active" && isInProfit;

  return {
    value,
    currentValueSol,
    currentValueUsd,
    unrealizedGainSol,
    unrealizedGainUsd,
    roiPercent,
    ownershipPercent,
    estimatedTokensAtGraduation,
    estimatedValueAtGraduationUsd,
    isInProfit,
    isAtLoss,
    canGraduate,
    recalculate: calculateValue,
  };
}

/**
 * Hook for calculating multiple positions at once
 */
export function usePortfolioValue(
  positions: Position[],
  launches: Map<string, Launch>,
  options: UsePositionValueOptions
): {
  totalValueSol: number;
  totalValueUsd: number;
  totalInvestedSol: number;
  totalInvestedUsd: number;
  totalUnrealizedPnlSol: number;
  totalUnrealizedPnlUsd: number;
  totalRoiPercent: number;
  positionValues: (PositionValue | null)[];
} {
  const { solPriceUsd } = options;

  return useMemo(() => {
    let totalValueSol = 0;
    let totalValueUsd = 0;
    let totalInvestedSol = 0;
    let totalInvestedUsd = 0;
    const positionValues: (PositionValue | null)[] = [];

    for (const position of positions) {
      const launch = launches.get(position.launchAddress);
      
      if (!launch || position.shares === 0) {
        positionValues.push(null);
        continue;
      }

      const { shares, solBasis } = position;
      const { totalShares } = launch;

      const sharePrice = getSharePrice(totalShares);
      const positionValue = getPositionValue(shares, totalShares);
      const positionValueUsd = (positionValue * solPriceUsd) / 1e9;
      const investedUsd = (solBasis * solPriceUsd) / 1e9;

      totalValueSol += positionValue / 1e9;
      totalValueUsd += positionValueUsd;
      totalInvestedSol += solBasis / 1e9;
      totalInvestedUsd += investedUsd;

      const positionValueData: PositionValue = {
        shares,
        sharePrice,
        sharePriceUsd: (sharePrice * solPriceUsd) / 1e9,
        positionValue,
        positionValueUsd,
        invested: solBasis,
        investedUsd,
        unrealizedGain: positionValue - solBasis,
        unrealizedGainUsd: positionValueUsd - investedUsd,
        roiPercent: solBasis > 0 ? ((positionValue - solBasis) / solBasis) * 100 : 0,
        ownershipPercent: getOwnershipPercent(shares, totalShares),
        estimatedTokensAtGraduation: 0,
        estimatedValueAtGraduation: 0,
        estimatedValueAtGraduationUsd: 0,
      };

      positionValues.push(positionValueData);
    }

    const totalUnrealizedPnlSol = totalValueSol - totalInvestedSol;
    const totalUnrealizedPnlUsd = totalValueUsd - totalInvestedUsd;
    const totalRoiPercent = totalInvestedUsd > 0
      ? (totalUnrealizedPnlUsd / totalInvestedUsd) * 100
      : 0;

    return {
      totalValueSol,
      totalValueUsd,
      totalInvestedSol,
      totalInvestedUsd,
      totalUnrealizedPnlSol,
      totalUnrealizedPnlUsd,
      totalRoiPercent,
      positionValues,
    };
  }, [positions, launches, solPriceUsd]);
}
