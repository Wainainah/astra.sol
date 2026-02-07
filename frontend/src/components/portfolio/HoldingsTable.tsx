"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Package,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

/**
 * V7 Portfolio Holding Interface
 * Simplified - no locked/unlocked split
 */
export interface PortfolioHolding {
  launchAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenImage: string | null;
  shares: number;
  solBasis: number;
  positionValueSol: number;
  positionValueUsd: number;
  unrealizedPnlSol: number;
  unrealizedPnlUsd: number;
  unrealizedPnlPercent: number;
  ownershipPercent: number;
  status: "active" | "graduated" | "refunding";
  hasClaimedTokens: boolean;
  hasClaimedRefund: boolean;
  firstBuyAt: string | null;
  lastUpdatedAt: string | null;
  graduatedToken?: string;
}

interface HoldingsTableProps {
  holdings: PortfolioHolding[];
  onSell?: (holding: PortfolioHolding) => void;
  onClaim?: (holding: PortfolioHolding) => void;
  solPriceUsd?: number;
}

/**
 * Format number with specified decimals
 */
function formatNumber(num: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format large numbers with K/M/B suffix
 */
function formatCompact(num: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}

/**
 * V7 Holdings Table
 *
 * Shows positions with "paper gains" - value on curve that can only
 * be realized at graduation. No locked/unlocked split in V7.
 */
export function HoldingsTable({
  holdings,
  onSell,
  onClaim,
  solPriceUsd = 0,
}: HoldingsTableProps) {
  // Sort by position value (highest first)
  const sortedHoldings = [...holdings].sort(
    (a, b) => b.positionValueSol - a.positionValueSol
  );

  const getStatusBadge = (status: PortfolioHolding["status"]) => {
    switch (status) {
      case "graduated":
        return (
          <Badge
            variant="secondary"
            className="font-mono text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
          >
            Graduated
          </Badge>
        );
      case "refunding":
        return (
          <Badge
            variant="destructive"
            className="font-mono text-xs"
          >
            Refunding
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="font-mono text-xs border-amber-500/30 text-amber-400"
          >
            Active
          </Badge>
        );
    }
  };

  const getActionButton = (holding: PortfolioHolding) => {
    // Graduated token - show Claim if not claimed
    if (holding.status === "graduated") {
      if (holding.hasClaimedTokens) {
        return (
          <span className="text-xs text-muted-foreground font-mono">
            Claimed
          </span>
        );
      }
      return (
        <Button
          size="sm"
          variant="default"
          onClick={() => onClaim?.(holding)}
          className="font-mono text-xs bg-emerald-600 hover:bg-emerald-700"
        >
          Claim
        </Button>
      );
    }

    // Refunding - show Refund if not claimed
    if (holding.status === "refunding") {
      if (holding.hasClaimedRefund) {
        return (
          <span className="text-xs text-muted-foreground font-mono">
            Refunded
          </span>
        );
      }
      return (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onClaim?.(holding)}
          className="font-mono text-xs"
        >
          Refund
        </Button>
      );
    }

    // Active - show Sell button
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onSell?.(holding)}
          className="font-mono text-xs"
        >
          Sell
        </Button>
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden bg-card/50">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50 bg-muted/30">
              <TableHead className="font-mono text-xs uppercase w-[200px]">
                Token
              </TableHead>
              <TableHead className="font-mono text-xs uppercase text-right">
                Shares
              </TableHead>
              <TableHead className="font-mono text-xs uppercase text-right">
                Invested
              </TableHead>
              <TableHead className="font-mono text-xs uppercase text-right">
                Current Value
              </TableHead>
              <TableHead className="font-mono text-xs uppercase text-right">
                Unrealized P&L
              </TableHead>
              <TableHead className="font-mono text-xs uppercase text-center">
                Status
              </TableHead>
              <TableHead className="font-mono text-xs uppercase text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedHoldings.map((holding) => (
              <TableRow
                key={holding.launchAddress}
                className="group hover:bg-muted/30 border-border/50"
              >
                {/* Token Column */}
                <TableCell>
                  <Link
                    href={`/token/${holding.launchAddress}`}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden ring-1 ring-border/50">
                      {holding.tokenImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={holding.tokenImage}
                          alt={holding.tokenName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-mono font-semibold">
                        {holding.tokenName}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        ${holding.tokenSymbol}
                      </p>
                    </div>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                  </Link>
                </TableCell>

                {/* Shares Column */}
                <TableCell className="text-right">
                  <p className="font-mono tabular-nums">
                    {formatCompact(holding.shares)}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {holding.ownershipPercent.toFixed(2)}% supply
                  </p>
                </TableCell>

                {/* Invested Column */}
                <TableCell className="text-right">
                  <p className="font-mono tabular-nums">
                    {formatNumber(holding.solBasis, 4)} SOL
                  </p>
                  {solPriceUsd > 0 && (
                    <p className="text-xs text-muted-foreground font-mono">
                      ${formatNumber(holding.solBasis * solPriceUsd)}
                    </p>
                  )}
                </TableCell>

                {/* Current Value Column */}
                <TableCell className="text-right">
                  <p className="font-mono tabular-nums font-medium">
                    {formatNumber(holding.positionValueSol, 4)} SOL
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    ${formatNumber(holding.positionValueUsd)}
                  </p>
                </TableCell>

                {/* Unrealized P&L Column */}
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      {holding.unrealizedPnlSol >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      )}
                      <span
                        className={`font-mono tabular-nums ${
                          holding.unrealizedPnlSol >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {holding.unrealizedPnlSol >= 0 ? "+" : ""}
                        {formatNumber(holding.unrealizedPnlSol, 4)} SOL
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs font-mono ${
                        holding.unrealizedPnlPercent >= 0
                          ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                          : "border-red-500/30 text-red-400 bg-red-500/10"
                      }`}
                    >
                      {holding.unrealizedPnlPercent >= 0 ? "+" : ""}
                      {holding.unrealizedPnlPercent.toFixed(2)}%
                    </Badge>
                  </div>
                </TableCell>

                {/* Status Column */}
                <TableCell className="text-center">
                  {getStatusBadge(holding.status)}
                </TableCell>

                {/* Actions Column */}
                <TableCell className="text-right">
                  {getActionButton(holding)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden">
        {sortedHoldings.map((holding) => (
          <div
            key={holding.launchAddress}
            className="p-4 border-b border-border/50 last:border-0 hover:bg-muted/20"
          >
            {/* Header: Token + Status */}
            <div className="flex items-center justify-between mb-3">
              <Link
                href={`/token/${holding.launchAddress}`}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden ring-1 ring-border/50">
                  {holding.tokenImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={holding.tokenImage}
                      alt={holding.tokenName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-mono font-semibold">{holding.tokenName}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    ${holding.tokenSymbol}
                  </p>
                </div>
              </Link>
              {getStatusBadge(holding.status)}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs text-muted-foreground font-mono uppercase">
                  Shares
                </p>
                <p className="font-mono tabular-nums">
                  {formatCompact(holding.shares)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-mono uppercase">
                  Invested
                </p>
                <p className="font-mono tabular-nums">
                  {formatNumber(holding.solBasis, 4)} SOL
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-mono uppercase">
                  Current Value
                </p>
                <p className="font-mono tabular-nums">
                  {formatNumber(holding.positionValueSol, 4)} SOL
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-mono uppercase">
                  P&L
                </p>
                <p
                  className={`font-mono tabular-nums ${
                    holding.unrealizedPnlSol >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {holding.unrealizedPnlSol >= 0 ? "+" : ""}
                  {formatNumber(holding.unrealizedPnlPercent, 2)}%
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              {getActionButton(holding)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
