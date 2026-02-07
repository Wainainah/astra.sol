/**
 * useClaimableItems Hook (V7)
 *
 * Fetches user positions and returns items that can be claimed:
 * - Graduated tokens with unclaimed tokens (proportional distribution)
 * - Refunding tokens with unclaimed SOL refunds
 * 
 * V7 CHANGES:
 * - Uses proportional token distribution: tokens = (shares / totalSharesAtGraduation) * 800M
 * - Only unlocked shares (shares field) count for claims
 * - lockedShares is for creator vesting only (separate claim flow)
 * - Uses estimateTokensAtGraduation from curve.ts
 */

import { useQuery } from "@tanstack/react-query";
import { PortfolioHolding } from "@/lib/api-types";

export interface ClaimableItem {
  launchAddress: string;
  tokenName: string;
  ticker: string;
  tokenMint?: string;
  type: "graduated" | "refunding";
  // For graduated
  shares?: number;
  tokensToReceive?: number;
  // For refunding
  basisToReceive?: number;
  protocolFee?: number;
  // Status
  hasClaimedTokens: boolean;
}

export interface UseClaimableItemsOptions {
  userAddress: string | undefined;
  enabled?: boolean;
}

export interface UseClaimableItemsResult {
  claimableItems: ClaimableItem[];
  graduatedItems: ClaimableItem[];
  refundingItems: ClaimableItem[];
  totalClaimable: number;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => void;
}

// Refund fee (0.5% protocol fee)
const REFUND_FEE_BPS = 50;

// V7: Portfolio API endpoint
async function fetchPortfolio(address: string): Promise<{ holdings: PortfolioHolding[] }> {
  const response = await fetch(`/api/portfolio/${address}`);
  if (!response.ok) {
    throw new Error("Failed to fetch portfolio");
  }
  return response.json();
}

/**
 * Hook for fetching claimable items from user portfolio
 * 
 * V7 Token Distribution:
 * - Regular holders: claim unlocked shares → proportional tokens
 * - Creator vesting: lockedShares vest over 42 days (useClaimVesting hook)
 * 
 * @example
 * ```tsx
 * const { claimableItems, graduatedItems, refundingItems, isLoading } = useClaimableItems({
 *   userAddress: wallet.publicKey?.toBase58()
 * });
 * ```
 */
export function useClaimableItems({
  userAddress,
  enabled = true,
}: UseClaimableItemsOptions): UseClaimableItemsResult {
  const {
    data: portfolio,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["portfolio", userAddress],
    queryFn: () => fetchPortfolio(userAddress!),
    enabled: enabled && !!userAddress,
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refresh every minute
  });

  // Process holdings into claimable items
  const claimableItems: ClaimableItem[] = [];

  if (portfolio?.holdings) {
    for (const holding of portfolio.holdings) {
      // V7: Graduated token with unclaimed tokens
      // Note: Only regular shares count for claim (not lockedShares)
      // lockedShares is for creator vesting only
      if (holding.graduated && !holding.hasClaimedTokens && holding.shares > 0) {
        // V7 PROPORTIONAL DISTRIBUTION:
        // tokens = (userShares / totalSharesAtGraduation) * TOKENS_FOR_HOLDERS (800M)
        // The API returns estimatedTokensAtGraduation which uses the correct totalSharesAtGraduation

        claimableItems.push({
          launchAddress: holding.launchAddress,
          tokenName: holding.tokenName,
          ticker: holding.tokenSymbol,
          type: "graduated",
          shares: holding.shares,
          // V7: Use the pre-calculated estimate from the API which has the correct totalSharesAtGraduation
          tokensToReceive: holding.estimatedTokensAtGraduation,
          hasClaimedTokens: holding.hasClaimedTokens,
        });
      }

      // V7: Refunding token with unclaimed refund
      if (holding.refundMode && !holding.hasClaimedRefund && holding.solBasis > 0) {
        const protocolFee = (holding.solBasis * REFUND_FEE_BPS) / 10000;
        const basisToReceive = holding.solBasis - protocolFee;

        claimableItems.push({
          launchAddress: holding.launchAddress,
          tokenName: holding.tokenName,
          ticker: holding.tokenSymbol,
          type: "refunding",
          basisToReceive,
          protocolFee,
          hasClaimedTokens: holding.hasClaimedRefund,
        });
      }
    }
  }

  // Filter into categories
  const graduatedItems = claimableItems.filter(
    (item) => item.type === "graduated" && !item.hasClaimedTokens
  );
  const refundingItems = claimableItems.filter(
    (item) => item.type === "refunding" && !item.hasClaimedTokens
  );
  const totalClaimable = graduatedItems.length + refundingItems.length;

  return {
    claimableItems,
    graduatedItems,
    refundingItems,
    totalClaimable,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}
