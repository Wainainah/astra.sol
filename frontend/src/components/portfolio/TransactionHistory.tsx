"use client";

import { useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  History,
  Package,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Transaction Type Definition
 */
export type TransactionType =
  | "buy"
  | "sell"
  | "claim"
  | "refund"
  | "create";

/**
 * Transaction Interface
 */
export interface Transaction {
  signature: string;
  type: TransactionType;
  launchAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenImage: string | null;
  solAmount: number | null;
  sharesAmount: number | null;
  timestamp: string;
  slot: number;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

/**
 * Transaction Type Configuration
 */
const TRANSACTION_CONFIG: Record<
  TransactionType,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline" | "success";
    icon: React.ElementType;
  }
> = {
  buy: {
    label: "Buy",
    variant: "default",
    icon: ArrowDownRight,
  },
  sell: {
    label: "Sell",
    variant: "destructive",
    icon: ArrowUpRight,
  },
  claim: {
    label: "Claim",
    variant: "success",
    icon: ArrowUpRight,
  },
  refund: {
    label: "Refund",
    variant: "outline",
    icon: ArrowUpRight,
  },
  create: {
    label: "Create",
    variant: "secondary",
    icon: ArrowUpRight,
  },
};

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
 * Truncate signature for display
 */
function truncateSignature(sig: string): string {
  return `${sig.slice(0, 4)}...${sig.slice(-4)}`;
}

/**
 * V7 Transaction History
 *
 * Shows user's transaction history with:
 * - Type (Buy/Sell/Claim/Refund/Create)
 * - Token info
 * - Amount in SOL or shares
 * - Timestamp
 * - Link to explorer
 */
export function TransactionHistory({
  transactions,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  className,
}: TransactionHistoryProps) {
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  // Sort by timestamp (newest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (isLoading && transactions.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed border-border/50 flex flex-col items-center justify-center py-12 px-4 text-center",
          className
        )}
      >
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <History className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-mono font-semibold mb-1">
          No transactions yet
        </h3>
        <p className="text-sm text-muted-foreground font-mono max-w-sm">
          Your transaction history will appear here once you start trading.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-lg border border-border/50 overflow-hidden bg-card/50">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50 bg-muted/30">
                <TableHead className="font-mono text-xs uppercase w-[100px]">
                  Type
                </TableHead>
                <TableHead className="font-mono text-xs uppercase">
                  Token
                </TableHead>
                <TableHead className="font-mono text-xs uppercase text-right">
                  Shares
                </TableHead>
                <TableHead className="font-mono text-xs uppercase text-right">
                  SOL
                </TableHead>
                <TableHead className="font-mono text-xs uppercase text-right w-[140px]">
                  Time
                </TableHead>
                <TableHead className="font-mono text-xs uppercase text-center w-[80px]">
                  Tx
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.map((tx) => {
                const config = TRANSACTION_CONFIG[tx.type];
                const Icon = config.icon;

                return (
                  <TableRow
                    key={tx.signature}
                    className="hover:bg-muted/30 border-border/50"
                  >
                    {/* Type */}
                    <TableCell>
                      <Badge
                        variant={config.variant}
                        className="font-mono text-xs gap-1"
                      >
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </TableCell>

                    {/* Token */}
                    <TableCell>
                      <Link
                        href={`/token/${tx.launchAddress}`}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                      >
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center overflow-hidden ring-1 ring-border/50">
                          {tx.tokenImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={tx.tokenImage}
                              alt={tx.tokenName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-mono font-medium">{tx.tokenName}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            ${tx.tokenSymbol}
                          </p>
                        </div>
                      </Link>
                    </TableCell>

                    {/* Shares */}
                    <TableCell className="text-right">
                      {tx.sharesAmount !== null ? (
                        <p className="font-mono tabular-nums">
                          {formatCompact(tx.sharesAmount)}
                        </p>
                      ) : (
                        <span className="text-muted-foreground font-mono">—</span>
                      )}
                    </TableCell>

                    {/* SOL */}
                    <TableCell className="text-right">
                      {tx.solAmount !== null ? (
                        <div className="flex items-center justify-end gap-1">
                          {tx.type === "buy" ? (
                            <ArrowDownRight className="h-3 w-3 text-red-400" />
                          ) : tx.type === "sell" ? (
                            <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                          ) : null}
                          <span className="font-mono tabular-nums">
                            {formatNumber(tx.solAmount, 4)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground font-mono">—</span>
                      )}
                    </TableCell>

                    {/* Time */}
                    <TableCell className="text-right">
                      <p className="font-mono text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(tx.timestamp), {
                          addSuffix: true,
                        })}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground/60">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </p>
                    </TableCell>

                    {/* Explorer Link */}
                    <TableCell className="text-center">
                      <a
                        href={`https://explorer.solana.com/tx/${tx.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center p-2 rounded-md hover:bg-muted transition-colors"
                        title="View on Solana Explorer"
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile List */}
        <div className="md:hidden">
          {sortedTransactions.map((tx) => {
            const config = TRANSACTION_CONFIG[tx.type];
            const isExpanded = expandedTx === tx.signature;

            return (
              <div
                key={tx.signature}
                className={cn(
                  "p-4 border-b border-border/50 last:border-0 hover:bg-muted/20",
                  isExpanded && "bg-muted/30"
                )}
                onClick={() =>
                  setExpandedTx(isExpanded ? null : tx.signature)
                }
              >
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={config.variant}
                      className="font-mono text-xs"
                    >
                      {config.label}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-muted flex items-center justify-center overflow-hidden">
                        {tx.tokenImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={tx.tokenImage}
                            alt={tx.tokenName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-mono font-medium text-sm">
                        {tx.tokenName}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {tx.solAmount !== null && (
                      <p
                        className={cn(
                          "font-mono tabular-nums text-sm",
                          tx.type === "buy"
                            ? "text-red-400"
                            : tx.type === "sell" || tx.type === "claim"
                            ? "text-emerald-400"
                            : ""
                        )}
                      >
                        {tx.type === "buy" ? "-" : "+"}
                        {formatNumber(tx.solAmount, 4)} SOL
                      </p>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground font-mono">
                        Shares
                      </span>
                      <span className="font-mono text-sm">
                        {tx.sharesAmount !== null
                          ? formatCompact(tx.sharesAmount)
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground font-mono">
                        Time
                      </span>
                      <span className="font-mono text-sm text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground font-mono">
                        Transaction
                      </span>
                      <a
                        href={`https://explorer.solana.com/tx/${tx.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-mono text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {truncateSignature(tx.signature)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="pt-2">
                      <Link
                        href={`/token/${tx.launchAddress}`}
                        className="block w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full font-mono text-xs"
                        >
                          View Token
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Subtle hint for expand */}
                {!isExpanded && (
                  <p className="text-xs text-muted-foreground/50 font-mono mt-2">
                    Tap to expand
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Load More Button */}
      {(hasMore || isLoading) && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoading}
            className="font-mono"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Load More
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// Import ChevronDown at the top, adding here for completeness
import { ChevronDown } from "lucide-react";

/**
 * Transaction History Item (for custom lists)
 */
export function TransactionItem({
  transaction,
  className,
}: {
  transaction: Transaction;
  className?: string;
}) {
  const config = TRANSACTION_CONFIG[transaction.type];

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Badge variant={config.variant} className="font-mono text-xs">
          {config.label}
        </Badge>
        <div>
          <p className="font-mono font-medium text-sm">
            {transaction.tokenName}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {formatDistanceToNow(new Date(transaction.timestamp), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>
      <div className="text-right">
        {transaction.solAmount !== null && (
          <p
            className={cn(
              "font-mono tabular-nums text-sm",
              transaction.type === "buy"
                ? "text-red-400"
                : transaction.type === "sell" || transaction.type === "claim"
                ? "text-emerald-400"
                : ""
            )}
          >
            {transaction.type === "buy" ? "-" : "+"}
            {formatNumber(transaction.solAmount, 4)} SOL
          </p>
        )}
      </div>
    </div>
  );
}
