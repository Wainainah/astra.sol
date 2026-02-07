"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PokeButton } from "@/components/token/PokeButton";
import { getMockVaults, VaultInfo } from "@/data/mockVaults";
import { formatDistanceToNow } from "date-fns";
import { Info, TrendingUp, Coins, Timer } from "lucide-react";
import { shortenAddress } from "@/lib/constants";

interface VaultStatsProps {
  userAddress: string;
}

export function VaultStats({ userAddress }: VaultStatsProps) {
  const vaults = getMockVaults(userAddress);

  if (vaults.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No vault earnings yet</p>
        <p className="text-xs mt-1">
          Vault earnings appear after your tokens graduate
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {vaults.map((vault) => (
        <VaultCard key={vault.launchAddress} vault={vault} />
      ))}
    </div>
  );
}

function VaultCard({ vault }: { vault: VaultInfo }) {
  const timeAgo = formatDistanceToNow(vault.lastPokeTimestamp, {
    addSuffix: true,
  });
  const rewardPrice = vault.rewardsValueUsd / vault.totalRewardsEarned;
  const pendingValueUsd = vault.pendingRewards * rewardPrice;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <CardTitle className="text-base">
              Vault Earnings: ${vault.ticker}
            </CardTitle>
          </div>
          <Badge
            variant="secondary"
            className="gap-1 bg-green-500/10 text-green-500"
          >
            <TrendingUp className="h-3 w-3" />
            APR {vault.aprPercent}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* LP Position Summary */}
        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">LP Position Value</span>
            <span className="font-mono font-semibold">
              ${vault.lpValue.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {vault.solAmount} SOL + {vault.tokenAmount.toLocaleString()} $
              {vault.ticker}
            </span>
          </div>
        </div>

        {/* LP Rewards Table */}
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="text-muted-foreground">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                      Total LP Rewards
                      <Info className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total LP fee rewards distributed from this pool</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="text-right font-mono">
                {vault.totalRewardsEarned.toLocaleString()} SOL
                <span className="text-xs text-muted-foreground ml-1">
                  (~${vault.rewardsValueUsd.toFixed(0)})
                </span>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-muted-foreground">
                Your Share (60%)
              </TableCell>
              <TableCell className="text-right font-mono text-primary">
                {vault.creatorShare.toFixed(4)} SOL
                <span className="text-xs text-muted-foreground ml-1">
                  (~${(vault.creatorShare * rewardPrice).toFixed(0)})
                </span>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-muted-foreground">
                Protocol (10%)
              </TableCell>
              <TableCell className="text-right font-mono">
                {vault.protocolShare.toFixed(4)} SOL
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-muted-foreground">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                      Auto-Compounded (29%)
                      <Info className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reinvested back into LP for compound growth</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="text-right font-mono">
                {vault.autoCompounded.toFixed(4)} SOL → LP
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Separator />

        {/* Poke Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Timer className="h-4 w-4" />
              <span>Last poke: {timeAgo}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              by {shortenAddress(vault.lastPokerAddress)}
            </span>
          </div>

          <div className="rounded-lg border border-dashed p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pending rewards</span>
              <span className="font-mono">
                ~{vault.pendingRewards.toFixed(4)} SOL
                <span className="text-xs text-muted-foreground ml-1">
                  (~${pendingValueUsd.toFixed(2)})
                </span>
              </span>
            </div>
            <PokeButton
              vaultAddress={vault.vaultAddress}
              tokenName={vault.tokenName}
              ticker={vault.ticker}
              pendingRewards={vault.pendingRewards}
            />
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1 text-xs text-muted-foreground mx-auto">
                <Info className="h-3 w-3" />
                Anyone can poke to harvest rewards
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Poking triggers reward distribution from the protocol. The
                  poker earns 1% as gas compensation. This is a public good!
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
