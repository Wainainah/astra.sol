/**
 * Astra Protocol V7 - React Hooks
 * 
 * All hooks for interacting with the Astra Protocol V7 bonding curve.
 */

// Buying shares
export { useBuy } from "./useBuy";
export type { UseBuyOptions, UseBuyResult } from "./useBuy";

// Selling shares
export { useSell } from "./useSell";
export type { UseSellOptions, UseSellResult, SellResult } from "./useSell";

// Claiming graduated tokens (V7: Proportional distribution)
export { useClaim } from "./useClaim";

// Claiming vested tokens (V7: Creator vesting)
export { useClaimVesting } from "./useClaimVesting";

// Claimable items (V7: Proportional token calculation)
export { useClaimableItems } from "./useClaimableItems";
export type { ClaimableItem, UseClaimableItemsOptions, UseClaimableItemsResult } from "./useClaimableItems";

// Position value calculations
export { usePositionValue, usePortfolioValue } from "./usePositionValue";
export type { UsePositionValueOptions, UsePositionValueResult } from "./usePositionValue";

// Token price metrics
export {
  useTokenPrice,
  useTokenPriceFromLaunch,
  useTokenPriceFromToken,
  useTokenPrices,
} from "./useTokenPrice";
export type { UseTokenPriceOptions, UseTokenPriceResult } from "./useTokenPrice";

// Graduation gates
export {
  useGraduationGates,
  useGraduationGatesFromData,
  useGraduationGatesBatch,
} from "./useGraduationGates";
export type { UseGraduationGatesOptions, UseGraduationGatesResult } from "./useGraduationGates";

// SOL Price
export { useSolPrice } from "./useSolPrice";

// Refund hooks (ADR-002: Automatic refunds)
export { useRefund } from "./useRefund";
export { useRefundStatus } from "./useRefundStatus";

// Poke hook (Vault harvesting)
export { usePoke, calculatePokerReward, calculateCreatorReward, calculateProtocolReward } from "./usePoke";

// Token balance
export { useTokenBalance } from "./useTokenBalance";

// Anchor program
export { useAnchorProgram } from "./useAnchorProgram";

// Create token
export { useCreateToken } from "./useCreateToken";
