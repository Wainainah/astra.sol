"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useVestingValue } from "@/hooks/useVestingValue";
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  Lock,
  Unlock,
  Clock,
  TrendingUp,
  ChevronDown,
  Loader2,
  Info,
  Gift,
} from "lucide-react";
import { toast } from "sonner";
import { VESTING_DAYS } from "@/lib/constants";

interface VestingValueCardProps {
  launchAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenPrice?: number; // USD per token
}

export function VestingValueCard({
  launchAddress,
  tokenSymbol,
  // tokenName reserved for future toast messages
  tokenPrice = 0,
}: VestingValueCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const { connected } = useWallet();

  const { vestingInfo, isLoading, isError, refetch } = useVestingValue({
    launchAddress,
    tokenPrice,
  });

  const handleClaim = async () => {
    if (!connected) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsClaiming(true);
    toast.loading("Submitting claim...", { id: "claim" });

    try {
      // V7: Claim vesting via Anchor program
      // Uses claim_vesting instruction - only creatorSeedShares can be claimed
      toast.success("Claim functionality coming soon!", { id: "claim" });
      refetch();
    } catch (error) {
      const message =
        error instanceof Error && error.message?.includes("user rejected")
          ? "Transaction cancelled"
          : "Claim failed";
      toast.error(message, { id: "claim" });
    } finally {
      setIsClaiming(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Creator Vesting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error or no vesting info
  if (isError || !vestingInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Creator Vesting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load vesting information.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Not graduated yet
  if (!vestingInfo.isGraduated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Creator Vesting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <Info className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Vesting Not Started</p>
              <p className="text-sm text-muted-foreground">
                Creator vesting begins after the token graduates.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format numbers for Solana (9 decimals)
  const formatTokens = (shares: bigint) => {
    const num = Number(shares) / LAMPORTS_PER_SOL;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const formatUsd = (usd: number) => {
    if (usd >= 1000000) return `$${(usd / 1000000).toFixed(2)}M`;
    if (usd >= 1000) return `$${(usd / 1000).toFixed(2)}K`;
    return `$${usd.toFixed(2)}`;
  };

  const claimableTokens = formatTokens(vestingInfo.claimableShares);
  const lockedTokens = formatTokens(vestingInfo.lockedShares);
  const dailyUnlock = formatTokens(vestingInfo.dailyUnlock);

  const hasClaimable = vestingInfo.claimableShares > BigInt(0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Creator Vesting
          </CardTitle>
          <Badge
            variant={
              vestingInfo.vestingProgress >= 100 ? "default" : "secondary"
            }
            className={vestingInfo.vestingProgress >= 100 ? "bg-green-500" : ""}
          >
            Day {vestingInfo.daysElapsed} / {VESTING_DAYS}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Values Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Claimable */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 cursor-help">
                  <div className="flex items-center gap-2 text-sm text-green-600 mb-1">
                    <Unlock className="h-4 w-4" />
                    Claimable
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {claimableTokens}
                  </p>
                  <p className="text-xs text-green-600/70">${tokenSymbol}</p>
                  {tokenPrice > 0 && (
                    <p className="text-sm font-medium text-green-600 mt-1">
                      ≈ {formatUsd(vestingInfo.claimableUsd)}
                    </p>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>V7: Only creator seed shares vest and can be claimed here</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Locked */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-4 rounded-lg bg-muted/50 border cursor-help">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Lock className="h-4 w-4" />
                    Locked
                  </div>
                  <p className="text-2xl font-bold">{lockedTokens}</p>
                  <p className="text-xs text-muted-foreground">
                    ${tokenSymbol}
                  </p>
                  {tokenPrice > 0 && (
                    <p className="text-sm font-medium text-muted-foreground mt-1">
                      ≈ {formatUsd(vestingInfo.lockedUsd)}
                    </p>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>V7: Locked creator seed shares - unlocks ~2.38% daily</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Vesting Progress</span>
            <span className="font-mono">
              {vestingInfo.vestingProgress.toFixed(1)}%
            </span>
          </div>
          <Progress value={vestingInfo.vestingProgress} className="h-2" />
        </div>

        {/* Unlock Info */}
        <div className="flex items-center justify-between text-sm py-2 px-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span>Daily Unlock</span>
          </div>
          <span className="font-mono font-medium">
            +{dailyUnlock} ${tokenSymbol}
          </span>
        </div>

        {/* Next Unlock Countdown */}
        {vestingInfo.nextUnlockTime && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Next Unlock</span>
            </div>
            <span className="font-mono">
              {formatTimeRemaining(vestingInfo.nextUnlockTime)}
            </span>
          </div>
        )}

        <Separator />

        {/* Claim Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleClaim}
          disabled={!hasClaimable || isClaiming || !connected}
        >
          {isClaiming ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Claiming...
            </>
          ) : hasClaimable ? (
            <>
              <Gift className="h-4 w-4 mr-2" />
              Claim {claimableTokens} ${tokenSymbol}
            </>
          ) : (
            "Nothing to Claim"
          )}
        </Button>

        {/* Collapsible Details */}
        <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full text-sm">
              <ChevronDown
                className={`h-4 w-4 mr-2 transition-transform ${isDetailsOpen ? "rotate-180" : ""}`}
              />
              {isDetailsOpen ? "Hide" : "Show"} Details
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Vested</span>
                <span className="font-mono">
                  {formatTokens(vestingInfo.totalVestedShares)} ${tokenSymbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Already Claimed</span>
                <span className="font-mono">
                  {formatTokens(vestingInfo.claimedShares)} ${tokenSymbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days Remaining</span>
                <span className="font-mono">
                  {vestingInfo.daysRemaining} days
                </span>
              </div>
              {vestingInfo.fullyVestedDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fully Vested</span>
                  <span className="font-mono">
                    {vestingInfo.fullyVestedDate.toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

// Helper to format time remaining
function formatTimeRemaining(targetDate: Date): string {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) return "Now";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
