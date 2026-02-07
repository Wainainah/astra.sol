/**
 * useCreatorVesting Hook - V7
 *
 * Fetches vesting information for tokens created by a user.
 * V7 UPDATE: Only the creator's SEED shares vest - all other shares unlock
 * immediately at graduation (no 92/8 split for regular buyers).
 *
 * Vesting schedule: 42 days, ~2.38% per day linear unlock
 */

import { useQuery } from "@tanstack/react-query";
import { useAnchorProgram } from "./useAnchorProgram";
import { PublicKey } from "@solana/web3.js";
import { VESTING_DAYS, VESTING_RATE_BPS } from "@/lib/constants";

export interface CreatorVestingItem {
  launchAddress: string;
  tokenName: string;
  ticker: string;
  tokenMint: string;
  // Investment
  seedInvestmentSol: number;
  totalVestingShares: number;
  // Vesting status
  isGraduated: boolean;
  vestingStartDate: Date | null;
  vestingDurationDays: number;
  daysElapsed: number;
  daysRemaining: number;
  percentComplete: number;
  // Shares breakdown
  unlockedShares: number;
  lockedShares: number;
  claimedShares: number;
  claimableShares: number;
  dailyUnlockAmount: number;
}

interface UseCreatorVestingOptions {
  creatorAddress: string | undefined;
  enabled?: boolean;
}

interface UseCreatorVestingResult {
  vestingItems: CreatorVestingItem[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for fetching creator vesting data from on-chain accounts
 * V7: Only creatorSeedShares vest - regular buyer shares unlock at graduation
 *
 * @example
 * ```tsx
 * const { vestingItems, isLoading } = useCreatorVesting({
 *   creatorAddress: wallet.publicKey?.toBase58()
 * });
 * ```
 */
export function useCreatorVesting({
  creatorAddress,
  enabled = true,
}: UseCreatorVestingOptions): UseCreatorVestingResult {
  const { program } = useAnchorProgram();

  const {
    data: vestingItems = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["creatorVesting", creatorAddress],
    queryFn: async (): Promise<CreatorVestingItem[]> => {
      if (!program || !creatorAddress) return [];

      try {
        // Fetch all launch accounts where this user is the creator
        // Note: This uses getProgramAccounts with a creator filter
        const creatorPubkey = new PublicKey(creatorAddress);

        // Filter launches by creator
        // The creator field is at offset 8 (after discriminator)
        const launches = await program.account.launch.all([
          {
            memcmp: {
              offset: 8, // After 8-byte discriminator
              bytes: creatorPubkey.toBase58(),
            },
          },
        ]);

        const items: CreatorVestingItem[] = [];

        for (const { account, publicKey } of launches) {
          // Only include graduated tokens (vesting only starts after graduation)
          if (!account.graduated) continue;

          // V7: Only creatorSeedShares vest - all other shares unlock at graduation
          const creatorSeedShares = BigInt(account.creatorSeedShares?.toString() || "0");
          const creatorClaimedShares = BigInt(account.creatorClaimedShares?.toString() || "0");

          // Skip if no seed investment
          if (creatorSeedShares === 0n) continue;

          // Calculate vesting progress
          const graduatedAt = account.graduatedAt
            ? new Date(Number(account.graduatedAt) * 1000)
            : null;

          const now = new Date();
          const daysSinceGraduation = graduatedAt
            ? Math.floor((now.getTime() - graduatedAt.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          const daysElapsed = Math.min(Math.max(0, daysSinceGraduation), VESTING_DAYS);
          const daysRemaining = VESTING_DAYS - daysElapsed;
          const percentComplete = (daysElapsed / VESTING_DAYS) * 100;

          // Calculate unlocked shares based on creatorSeedShares only
          const totalUnlockBps = daysElapsed * VESTING_RATE_BPS;
          const unlockPercent = Math.min(totalUnlockBps / 10000, 1);
          const unlockedShares = Number(creatorSeedShares) * unlockPercent;
          const lockedShares = Number(creatorSeedShares) - unlockedShares;
          const claimedShares = Number(creatorClaimedShares);
          const claimableShares = Math.max(0, unlockedShares - claimedShares);

          // Daily unlock amount
          const dailyUnlockAmount = Number(creatorSeedShares) * (VESTING_RATE_BPS / 10000);

          items.push({
            launchAddress: publicKey.toBase58(),
            tokenName: account.name || "Unknown",
            ticker: account.symbol || "???",
            tokenMint: account.tokenMint?.toBase58() || "",
            seedInvestmentSol: Number(account.creatorSeedBasis || 0) / 1e9,
            totalVestingShares: Number(creatorSeedShares) / 1e9, // V7: Only seed shares vest
            isGraduated: true,
            vestingStartDate: graduatedAt,
            vestingDurationDays: VESTING_DAYS,
            daysElapsed,
            daysRemaining,
            percentComplete,
            unlockedShares: unlockedShares / 1e9,
            lockedShares: lockedShares / 1e9,
            claimedShares: claimedShares / 1e9,
            claimableShares: claimableShares / 1e9,
            dailyUnlockAmount: dailyUnlockAmount / 1e9,
          });
        }

        return items;
      } catch (error) {
        console.error("Failed to fetch creator vesting:", error);
        throw error;
      }
    },
    enabled: enabled && !!creatorAddress && !!program,
    staleTime: 60_000, // 1 minute
    refetchInterval: 5 * 60_000, // Refresh every 5 minutes
  });

  return {
    vestingItems,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}
