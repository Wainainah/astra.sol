"use client";

import { useState, useEffect } from "react";
import { useAnchorProgram } from "./useAnchorProgram";
import { PublicKey } from "@solana/web3.js";
import { VESTING_DAYS, VESTING_RATE_BPS } from "@/lib/constants";

interface VestingInfo {
  isGraduated: boolean;
  claimableShares: bigint;
  lockedShares: bigint;
  totalVestedShares: bigint;
  claimedShares: bigint;
  dailyUnlock: bigint;
  vestingProgress: number;
  daysElapsed: number;
  daysRemaining: number;
  claimableUsd: number;
  lockedUsd: number;
  nextUnlockTime?: Date;
  fullyVestedDate?: Date;
}

interface UseVestingValueProps {
  launchAddress: string;
  tokenPrice: number;
}

/**
 * Hook to fetch vesting information for a creator - V7
 * V7 UPDATE: Only creatorSeedShares vest (no 92/8 split)
 * All regular buyer shares unlock immediately at graduation
 */
export function useVestingValue({
  launchAddress,
  tokenPrice,
}: UseVestingValueProps) {
  const { program } = useAnchorProgram();
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [vestingInfo, setVestingInfo] = useState<VestingInfo | null>(null);

  useEffect(() => {
    const fetchVestingInfo = async () => {
      if (!program || !launchAddress) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setIsError(false);

        // Try to fetch the launch account
        const launchPda = new PublicKey(launchAddress);
        const launch = await program.account.launch.fetch(launchPda);

        const isGraduated = launch.graduated;

        if (!isGraduated) {
          // Not graduated yet - no vesting
          setVestingInfo({
            isGraduated: false,
            claimableShares: BigInt(0),
            lockedShares: BigInt(0),
            totalVestedShares: BigInt(0),
            claimedShares: BigInt(0),
            dailyUnlock: BigInt(0),
            vestingProgress: 0,
            daysElapsed: 0,
            daysRemaining: VESTING_DAYS, // 42 days
            claimableUsd: 0,
            lockedUsd: 0,
          });
          setIsLoading(false);
          return;
        }

        // Calculate vesting based on graduation time
        const graduatedAt = launch.graduatedAt
          ? new Date(launch.graduatedAt.toNumber() * 1000)
          : new Date();

        const now = new Date();
        const daysSinceGraduation = Math.floor(
          (now.getTime() - graduatedAt.getTime()) / (1000 * 60 * 60 * 24),
        );

        // V7: Vesting is 42 days, ~2.38% per day
        // Only the creator's SEED shares vest - all other shares unlock at graduation
        const vestingDays = VESTING_DAYS; // 42 days
        const vestingRateBps = VESTING_RATE_BPS; // ~238 bps (~2.38% per day)
        const daysElapsed = Math.min(daysSinceGraduation, vestingDays);
        const daysRemaining = Math.max(0, vestingDays - daysElapsed);
        const vestingProgress = (daysElapsed / vestingDays) * 100;

        // V7: Get creator's seed shares only (not regular locked shares)
        // creatorSeedShares is the only vesting source in V7
        const creatorSeedShares = BigInt(
          launch.creatorSeedShares?.toString() || "0",
        );
        const creatorClaimedShares = BigInt(
          launch.creatorClaimedShares?.toString() || "0",
        );

        // Calculate how much has unlocked from seed shares only
        const totalUnlockBps = daysElapsed * vestingRateBps;
        const totalUnlockPercent = Math.min(totalUnlockBps / 10000, 1);

        const totalVested = creatorSeedShares; // V7: Only seed shares vest
        const unlocked = BigInt(
          Math.floor(Number(totalVested) * totalUnlockPercent),
        );
        const claimable =
          unlocked > creatorClaimedShares
            ? unlocked - creatorClaimedShares
            : BigInt(0);
        const locked = totalVested - unlocked;

        const dailyUnlock = BigInt(
          Math.floor(Number(totalVested) * (vestingRateBps / 10000)),
        );

        // Calculate USD values
        const claimableNum = Number(claimable) / 1e9;
        const lockedNum = Number(locked) / 1e9;
        const claimableUsd = claimableNum * tokenPrice;
        const lockedUsd = lockedNum * tokenPrice;

        // Calculate dates
        const nextUnlockTime =
          daysElapsed < vestingDays
            ? new Date(
                graduatedAt.getTime() + (daysElapsed + 1) * 24 * 60 * 60 * 1000,
              )
            : undefined;
        const fullyVestedDate = new Date(
          graduatedAt.getTime() + vestingDays * 24 * 60 * 60 * 1000,
        );

        setVestingInfo({
          isGraduated: true,
          claimableShares: claimable,
          lockedShares: locked,
          totalVestedShares: totalVested,
          claimedShares: creatorClaimedShares,
          dailyUnlock,
          vestingProgress,
          daysElapsed,
          daysRemaining,
          claimableUsd,
          lockedUsd,
          nextUnlockTime,
          fullyVestedDate,
        });
      } catch (error) {
        console.error("Error fetching vesting info:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVestingInfo();
  }, [program, launchAddress, tokenPrice]);

  const refetch = () => {
    setIsLoading(true);
    // Force re-run useEffect by updating dependencies
  };

  return {
    vestingInfo,
    isLoading,
    isError,
    refetch,
  };
}
