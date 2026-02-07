/**
 * HoldersList Component - Astra Protocol V7
 *
 * Table of token holders:
 * - Rank, Address
 * - Shares (single column, not locked/unlocked)
 * - % Ownership
 * - Remove locked/unlocked breakdown
 */

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  Crown,
  Medal,
  Award,
  ExternalLink,
  Copy,
  ChevronLeft,
  ChevronRight,
  Wallet,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import type { Position } from "@/lib/api-types";
import { GRADUATION_MAX_CONCENTRATION_BPS } from "@/lib/constants";
import { getOwnershipPercent } from "@/lib/curve";
import { useState } from "react";

interface HoldersListProps {
  holders: Position[];
  totalShares: number;
  className?: string;
  pageSize?: number;
}

// Rank icons for top holders
const RankIcon = ({ rank }: { rank: number }) => {
  switch (rank) {
    case 1:
      return <Crown className="w-4 h-4 text-yellow-400" />;
    case 2:
      return <Medal className="w-4 h-4 text-slate-300" />;
    case 3:
      return <Medal className="w-4 h-4 text-amber-600" />;
    default:
      return <span className="text-slate-500 font-mono text-sm">#{rank}</span>;
  }
};

// Format address for display
const formatAddress = (address: string) => {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Copy to clipboard
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

export function HoldersList({
  holders,
  totalShares,
  className = "",
  pageSize = 20,
}: HoldersListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Calculate total pages
  const totalPages = Math.ceil(holders.length / pageSize);

  // Get current page holders
  const startIndex = (currentPage - 1) * pageSize;
  const currentHolders = holders.slice(startIndex, startIndex + pageSize);

  // Handle copy with feedback
  const handleCopy = (address: string) => {
    copyToClipboard(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Calculate concentration warning
  const topHolder = holders[0];
  const topHolderPercent = topHolder
    ? getOwnershipPercent(topHolder.shares + topHolder.lockedShares, totalShares)
    : 0;
  const concentrationWarning =
    topHolderPercent > GRADUATION_MAX_CONCENTRATION_BPS / 100;

  return (
    <TooltipProvider>
      <Card
        className={`bg-slate-950 border-slate-800 overflow-hidden ${className}`}
      >
        {/* Header */}
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Holders
              <Badge
                variant="outline"
                className="border-slate-700 text-slate-400"
              >
                {holders.length.toLocaleString()}
              </Badge>
            </CardTitle>

            {/* Concentration Warning */}
            {concentrationWarning && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-amber-400 text-sm bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4" />
                    <span>High Concentration</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-xs">
                  <p>
                    Top holder owns {topHolderPercent.toFixed(1)}% of supply.
                    Must be under 10% for graduation.
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Holders Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400 w-16">Rank</TableHead>
                  <TableHead className="text-slate-400">Holder</TableHead>
                  <TableHead className="text-slate-400 text-right">
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1 ml-auto cursor-help">
                        Shares
                        <TrendingUp className="w-3 h-3" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
                        <p>Total shares owned (unlocked only)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="text-slate-400 text-right">
                    Ownership
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentHolders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-slate-500 py-8"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Wallet className="w-8 h-8 text-slate-600" />
                        <p>No holders yet</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentHolders.map((holder, index) => {
                    const rank = startIndex + index + 1;
                    const ownershipPercent = getOwnershipPercent(
                      holder.shares + holder.lockedShares,
                      totalShares
                    );
                    const isHighConcentration =
                      ownershipPercent > GRADUATION_MAX_CONCENTRATION_BPS / 100;

                    return (
                      <TableRow
                        key={holder.userAddress}
                        className="border-slate-800/50 hover:bg-slate-900/50"
                      >
                        {/* Rank */}
                        <TableCell>
                          <div className="flex items-center justify-center w-8">
                            <RankIcon rank={rank} />
                          </div>
                        </TableCell>

                        {/* Address */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={`https://solscan.io/account/${holder.userAddress}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-slate-200 hover:text-cyan-400 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {formatAddress(holder.userAddress)}
                                </a>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
                                <p>{holder.userAddress}</p>
                              </TooltipContent>
                            </Tooltip>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-slate-500 hover:text-slate-300"
                              onClick={() => handleCopy(holder.userAddress)}
                            >
                              {copiedAddress === holder.userAddress ? (
                                <span className="text-emerald-400 text-xs">✓</span>
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>

                            <a
                              href={`https://solscan.io/account/${holder.userAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-500 hover:text-slate-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </TableCell>

                        {/* Shares */}
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-mono text-slate-200">
                              {holder.shares.toLocaleString()}
                            </span>
                            {holder.lockedShares > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs text-slate-500">
                                    +{holder.lockedShares.toLocaleString()} locked
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
                                  <p>Creator vesting shares</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>

                        {/* Ownership % */}
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                className={`font-mono ${
                                  isHighConcentration
                                    ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
                                    : rank <= 3
                                    ? "border-cyan-500/30 text-cyan-400"
                                    : "border-slate-700 text-slate-400"
                                }`}
                              >
                                {ownershipPercent.toFixed(2)}%
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
                              <p>
                                {isHighConcentration
                                  ? "High concentration - blocks graduation"
                                  : `${ownershipPercent.toFixed(4)}% of total supply`}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
              <div className="text-sm text-slate-500">
                Showing {startIndex + 1}-{Math.min(startIndex + pageSize, holders.length)}{" "}
                of {holders.length} holders
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-slate-400 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

// Loading skeleton
export function HoldersListSkeleton() {
  return (
    <Card className="bg-slate-950 border-slate-800 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-slate-900 rounded animate-pulse" />
          <div className="h-6 w-16 bg-slate-900 rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-8 bg-slate-900 rounded animate-pulse" />
              <div className="h-4 w-32 bg-slate-900 rounded animate-pulse" />
              <div className="ml-auto h-4 w-24 bg-slate-900 rounded animate-pulse" />
              <div className="h-4 w-16 bg-slate-900 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
