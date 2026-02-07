"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCreatorVesting, type CreatorVestingItem } from "@/hooks/useCreatorVesting";
import { useClaimVesting } from "@/hooks/useClaimVesting";
import { Clock, Info, Unlock, Loader2 } from "lucide-react";
import { useState } from "react";

interface VestingProgressProps {
  userAddress: string;
}

export function VestingProgress({ userAddress }: VestingProgressProps) {
  const { vestingItems, isLoading, isError } = useCreatorVesting({
    creatorAddress: userAddress,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Failed to load vesting data</p>
        <p className="text-xs mt-1">Please try again later</p>
      </div>
    );
  }

  if (vestingItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No vesting schedules found</p>
        <p className="text-xs mt-1">
          Vesting applies to creator seed investments in graduated tokens
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {vestingItems.map((vesting) => (
        <VestingCard key={vesting.launchAddress} vesting={vesting} />
      ))}
    </div>
  );
}

function VestingCard({ vesting }: { vesting: CreatorVestingItem }) {
  const [claiming, setClaiming] = useState(false);
  const { claimVesting, isPending } = useClaimVesting({
    launchAddress: vesting.launchAddress,
    tokenMint: vesting.tokenMint,
  });

  const handleClaimVesting = async () => {
    setClaiming(true);
    try {
      await claimVesting();
    } finally {
      setClaiming(false);
    }
  };

  const isClaimPending = claiming || isPending;
  const hasClaimable = vesting.claimableShares > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              Creator Vesting: ${vesting.ticker}
            </CardTitle>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {vesting.daysRemaining} days left
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress
            value={vesting.percentComplete}
            className="h-3"
            aria-label={`Vesting progress: ${vesting.percentComplete.toFixed(0)} percent complete`}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {vesting.daysElapsed} / {vesting.vestingDurationDays} days
            </span>
            <span>{vesting.percentComplete.toFixed(1)}% complete</span>
          </div>
        </div>

        {/* Info Tooltip - V7: Only creator seed shares vest */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <Info className="h-3 w-3" />
              ~2.38% of your seed investment unlocks daily
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                As the creator, your initial seed investment of{" "}
                {vesting.seedInvestmentSol.toFixed(4)} SOL is converted to tokens that vest
                over {vesting.vestingDurationDays} days (~2.38% per day). This
                prevents immediate dumping and aligns your incentives with
                long-term success. V7 Update: Only your seed investment vests - 
                all other shares unlock immediately at graduation.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Stats Table */}
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="text-muted-foreground">
                Seed Investment
              </TableCell>
              <TableCell className="text-right font-mono">
                {vesting.seedInvestmentSol.toFixed(4)} SOL
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-muted-foreground">
                Total Vesting
              </TableCell>
              <TableCell className="text-right font-mono">
                {vesting.totalVestingShares.toLocaleString()} ${vesting.ticker}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-muted-foreground">
                Already Unlocked
              </TableCell>
              <TableCell className="text-right font-mono text-primary">
                {vesting.unlockedShares.toLocaleString()} ${vesting.ticker}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-muted-foreground">
                Already Claimed
              </TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">
                {vesting.claimedShares.toLocaleString()} ${vesting.ticker}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-muted-foreground">
                Still Locked
              </TableCell>
              <TableCell className="text-right font-mono">
                {vesting.lockedShares.toLocaleString()} ${vesting.ticker}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-muted-foreground">
                Daily Unlock
              </TableCell>
              <TableCell className="text-right font-mono">
                ~{vesting.dailyUnlockAmount.toFixed(0)} ${vesting.ticker}/day
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {/* Claim Button */}
        <Button
          className="w-full"
          onClick={handleClaimVesting}
          disabled={!hasClaimable || isClaimPending}
        >
          {isClaimPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Unlock className="h-4 w-4 mr-2" />
          )}
          {isClaimPending
            ? "Claiming..."
            : hasClaimable
              ? `Claim Unlocked (${vesting.claimableShares.toLocaleString()} $${vesting.ticker})`
              : "No Tokens to Claim"}
        </Button>
      </CardContent>
    </Card>
  );
}
