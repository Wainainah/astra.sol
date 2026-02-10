/**
 * Unified trading hook that seamlessly switches between
 * bonding curve (pre-graduation) and Jupiter (post-graduation)
 */

import { useMemo, useCallback } from "react";
import { useBuy } from "./useBuy";
import { useSell } from "./useSell";
import { useJupiterSwap } from "./useJupiterSwap";
import { useTokenBalance } from "./useTokenBalance";
import { useClaim } from "./useClaim";
import { toast } from "sonner";

export type TradingMode = "bonding-curve" | "jupiter";

interface UseUnifiedTradeProps {
  launchAddress: string | undefined;
  tokenMint: string | undefined;
  isGraduated: boolean;
}

export function useUnifiedTrade({
  launchAddress,
  tokenMint,
  isGraduated,
}: UseUnifiedTradeProps) {
  // 1. Balances (Unified)
  const {
    balance: unclaimedShares,
    refetch: refreshBalance,
  } = useTokenBalance(tokenMint, launchAddress);

  // 2. Bonding curve hooks (pre-graduation)
  const bondingBuy = useBuy({ launchAddress });
  const bondingSell = useSell({ launchAddress });

  // 3. Jupiter hook (post-graduation)
  const jupiter = useJupiterSwap({ tokenMint: tokenMint || "" });

  // 4. Claim hook (for bundling)
  const { claim } = useClaim({ launchAddress, tokenMint });

  // Unified buy function - memoized to prevent recreating on every render
  const buy = useMemo(() => {
    if (isGraduated && tokenMint) {
      return jupiter.buy;
    }
    return bondingBuy.buy;
  }, [isGraduated, tokenMint, jupiter.buy, bondingBuy.buy]);

  // Unified sell function (with ZERO-CLICK bundling)
  const sell = useCallback(
    async (amount: string) => {
      if (isGraduated && tokenMint) {
        // Check if we need to claim first
        if (unclaimedShares > 0) {
          try {
            toast.info("Auto-migrating tokens before sell...");
            await claim();
            await refreshBalance();
            // After claim, proceed to swap
            return await jupiter.sell(amount);
          } catch (e) {
            console.error("Migration during sell failed:", e);
            toast.error("Migration failed. Please try again.");
            return null;
          }
        }
        return jupiter.sell(amount);
      }
      // Passthrough to bonding curve sell - caller handles full args
      return (bondingSell.sell as any)(amount);
    },
    // Using specific methods rather than whole objects for better dependency tracking
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isGraduated,
      tokenMint,
      unclaimedShares,
      claim,
      refreshBalance,
      jupiter.sell,
      bondingSell.sell,
    ],
  );

  // Combined pending state
  const isPending = useMemo(() => {
    if (isGraduated) {
      return jupiter.isPending;
    }
    return bondingBuy.isPending || bondingSell.isPending;
  }, [
    isGraduated,
    jupiter.isPending,
    bondingBuy.isPending,
    bondingSell.isPending,
  ]);

  // Current trading mode
  const tradingMode: TradingMode = isGraduated ? "jupiter" : "bonding-curve";

  return {
    buy,
    sell,
    isPending,
    isGraduated,
    tradingMode,
    // Jupiter-specific status (useful for UI feedback)
    jupiterStatus: jupiter.status,
    jupiterError: jupiter.error,
    resetJupiter: jupiter.reset,
  };
}
