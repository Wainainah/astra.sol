"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  RefreshCw,
  Plus,
  Activity,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDistanceToNow } from "date-fns";

// V7: Simplified transaction type - no locked/unlocked split
interface Transaction {
  signature: string;
  userAddress: string;
  type: "buy" | "sell" | "claim" | "refund" | "create";
  solAmount?: number | null;
  tokenAmount?: number | null;
  timestamp: string;
}

interface ActivityFeedProps {
  tokenAddress: string;
  limit?: number;
}

type TransactionType = "buy" | "sell" | "claim" | "refund" | "create";

const typeConfig: Record<
  TransactionType,
  { label: string; icon: React.ReactNode; className: string }
> = {
  buy: {
    label: "Buy",
    icon: <ArrowUpRight className="h-3 w-3" />,
    className: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  },
  sell: {
    label: "Sell",
    icon: <ArrowDownRight className="h-3 w-3" />,
    className: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  },
  claim: {
    label: "Claim",
    icon: <Gift className="h-3 w-3" />,
    className: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  },
  refund: {
    label: "Refund",
    icon: <RefreshCw className="h-3 w-3" />,
    className: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  },
  create: {
    label: "Create",
    icon: <Plus className="h-3 w-3" />,
    className: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
  },
};

// V7: Simplified formatAmount - no locked/unlocked split mentions
function formatAmount(tx: Transaction): string {
  switch (tx.type) {
    case "buy":
      // V7: Show simple buy amount without locked/unlocked split
      return `${tx.solAmount?.toFixed(4)} SOL`;
    case "sell":
      return `${(tx.tokenAmount || 0).toLocaleString()} tokens → ${tx.solAmount?.toFixed(4)} SOL`;
    case "claim":
      return `${(tx.tokenAmount || 0).toLocaleString()} tokens`;
    case "refund":
      return `${tx.solAmount?.toFixed(4)} SOL`;
    case "create":
      return tx.solAmount ? `${tx.solAmount.toFixed(4)} SOL` : "Token created";
    default:
      return tx.solAmount ? `${tx.solAmount.toFixed(4)} SOL` : "";
  }
}

// Format address for display
function shortenAddress(address: string): string {
  if (!address || address.length < 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// Fetch transactions from API
async function fetchTransactions(tokenAddress: string, limit: number): Promise<{ transactions: Transaction[] }> {
  const response = await fetch(`/api/tokens/${tokenAddress}/transactions?limit=${limit}`);
  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }
  return response.json();
}

export function ActivityFeed({ tokenAddress, limit = 10 }: ActivityFeedProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["token-transactions", tokenAddress, limit],
    queryFn: () => fetchTransactions(tokenAddress, limit),
    enabled: !!tokenAddress,
    staleTime: 15_000,
  });

  const transactions = data?.transactions ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[100px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="NO ACTIVITY"
        description="No transactions yet. Be the first to trade this token!"
        variant="muted"
        className="py-8"
      />
    );
  }

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-4">
        {transactions.map((tx, index) => {
          // Defensive: fallback to default config if type is unknown
          const config = typeConfig[tx.type as TransactionType] || {
            label: tx.type || "Unknown",
            icon: <span className="h-3 w-3">?</span>,
            className: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
          };
          const timeAgo = formatDistanceToNow(new Date(tx.timestamp), {
            addSuffix: true,
          });

          return (
            <div
              key={`${tx.signature}-${index}`}
              className="flex items-start gap-3 pb-4 border-b border-border last:border-0"
            >
              {/* Avatar placeholder */}
              <Avatar className="h-8 w-8 bg-muted flex items-center justify-center text-xs">
                <span>{tx.userAddress.slice(2, 4).toUpperCase()}</span>
              </Avatar>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm">
                    {shortenAddress(tx.userAddress)}
                  </span>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${config.className}`}
                  >
                    {config.icon}
                    <span className="ml-1">{config.label}</span>
                  </Badge>
                </div>
                {/* V7: Simplified amount display - no locked/unlocked split mentions */}
                <p className="text-sm text-muted-foreground mt-1">
                  {formatAmount(tx)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
