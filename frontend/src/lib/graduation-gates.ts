/**
 * V7 Graduation Gates
 * 
 * Off-chain graduation criteria checking.
 * All gates must pass for a launch to be eligible for graduation.
 */

import {
  GRADUATION_MARKET_CAP_USD,
  GRADUATION_MIN_HOLDERS,
  GRADUATION_MAX_CONCENTRATION_BPS,
} from "./constants";
import type { GraduationGates, Position, Launch } from "./api-types";

/**
 * Check if a launch meets all graduation criteria
 */
export function checkGraduationGates(
  launch: Launch,
  holders: Position[]
): GraduationGates {
  // Calculate holders (excluding those who sold everything)
  const activeHolders = holders.filter(
    (h) => h.shares > 0 || h.lockedShares > 0
  );
  const holderCount = activeHolders.length;

  // Calculate concentration (top holder %)
  const totalShares = launch.totalShares;
  const maxHolderShares = activeHolders.length > 0
    ? Math.max(...activeHolders.map((h) => h.shares + h.lockedShares))
    : 0;
  const concentration =
    totalShares > 0 ? (maxHolderShares / totalShares) * BPS_DENOMINATOR : 0;

  // Check each gate
  const marketCapMet = launch.marketCapUsd >= GRADUATION_MARKET_CAP_USD;
  const holdersMet = holderCount >= GRADUATION_MIN_HOLDERS;
  const concentrationMet = concentration <= GRADUATION_MAX_CONCENTRATION_BPS;

  // Build blocking reasons
  const blockingReasons: string[] = [];

  if (!marketCapMet) {
    const remaining = GRADUATION_MARKET_CAP_USD - launch.marketCapUsd;
    blockingReasons.push(
      `Market cap $${launch.marketCapUsd.toLocaleString()} / $${GRADUATION_MARKET_CAP_USD.toLocaleString()} (need $${remaining.toLocaleString()} more)`
    );
  }

  if (!holdersMet) {
    const needed = GRADUATION_MIN_HOLDERS - holderCount;
    blockingReasons.push(
      `Holders ${holderCount} / ${GRADUATION_MIN_HOLDERS} (need ${needed} more)`
    );
  }

  if (!concentrationMet) {
    blockingReasons.push(
      `Concentration ${(concentration / 100).toFixed(1)}% / 10% (top holder too large)`
    );
  }

  return {
    marketCapUsd: launch.marketCapUsd,
    marketCapTarget: GRADUATION_MARKET_CAP_USD,
    holders: holderCount,
    holdersTarget: GRADUATION_MIN_HOLDERS,
    concentration,
    concentrationTarget: GRADUATION_MAX_CONCENTRATION_BPS,
    canGraduate: marketCapMet && holdersMet && concentrationMet,
    blockingReasons,
  };
}

/**
 * Get graduation status message
 */
export function getGraduationStatus(gates: GraduationGates): {
  status: "ready" | "approaching" | "not_ready";
  message: string;
  color: string;
} {
  if (gates.canGraduate) {
    return {
      status: "ready",
      message: "Ready to graduate!",
      color: "green",
    };
  }

  const progress = gates.marketCapUsd / gates.marketCapTarget;

  if (progress >= 0.75) {
    return {
      status: "approaching",
      message: `Approaching graduation: ${gates.blockingReasons.join(", ")}`,
      color: "yellow",
    };
  }

  return {
    status: "not_ready",
    message: `Not ready: ${gates.blockingReasons.join(", ")}`,
    color: "gray",
  };
}

// Re-export for convenience
import { BPS_DENOMINATOR } from "./constants";
export { BPS_DENOMINATOR };
