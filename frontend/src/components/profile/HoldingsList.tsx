"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Wallet } from "lucide-react";
import { getUserPositions, getTokensByAddresses } from "@/data/api";
import type { Position, Token } from "@/lib/api-types";
import { useSolPrice } from "@/hooks/useSolPrice";
import { calculateProgress, formatUSD } from "@/lib/constants";
import { EmptyState } from "@/components/ui/empty-state";

interface HoldingsListProps {
  userAddress: string;
}

const statusColors = {
  active: "secondary",
  graduated: "outline",
  refunding: "destructive",
} as const;

/**
 * HoldingsList - displays user's token positions with token details
 * V7 UPDATE: Simplified - shows only total shares (no locked/unlocked breakdown)
 * All shares unlock immediately at graduation except creator seed shares
 *
 * Data flow:
 * 1. Fetch positions from /api/users/[addr]/positions
 * 2. For each position, fetch token details from /api/tokens/[addr]
 * 3. Combine and display
 */
export function HoldingsList({ userAddress }: HoldingsListProps) {
  // Get current SOL price for USD-based progress calculation
  const { price: solPrice } = useSolPrice();

  // Fetch user positions
  const {
    data: positionsData,
    isLoading: isLoadingPositions,
    error: positionsError,
    refetch: refetchPositions,
  } = useQuery({
    queryKey: ["user-positions", userAddress],
    queryFn: () => getUserPositions(userAddress),
    enabled: !!userAddress,
    staleTime: 30_000,
  });

  const positions = useMemo(
    () => positionsData?.positions ?? [],
    [positionsData?.positions],
  );

  // Fetch token details for each position
  const positionAddresses = useMemo(
    () => positions.map((position) => position.launchAddress),
    [positions],
  );

  const {
    data: tokensBatch,
    isLoading: isLoadingTokens,
    error: tokensError,
  } = useQuery({
    queryKey: ["tokens-batch", positionAddresses],
    queryFn: () => getTokensByAddresses(positionAddresses),
    enabled: positionAddresses.length > 0,
    staleTime: 60_000,
  });

  const isLoading = isLoadingPositions || isLoadingTokens;

  const tokenMap = useMemo(() => {
    const map = new Map<string, Token | null>();
    tokensBatch?.tokens?.forEach((token) => {
      map.set(token.address, token);
    });
    return map;
  }, [tokensBatch]);

  // Loading state
  if (isLoading) {
    return <HoldingsListSkeleton />;
  }

  // Error state
  if (positionsError || tokensError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to load holdings</span>
          <Button variant="ghost" size="sm" onClick={() => refetchPositions()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (positions.length === 0) {
    return (
      <Card className="cyber-card">
        <CardContent className="p-0">
          <EmptyState
            icon={Wallet}
            title="NO HOLDINGS"
            description="You don't have any token positions yet. Start trading to build your portfolio!"
            variant="muted"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {positions.map((position) => {
        const token = tokenMap.get(position.launchAddress);
        return (
          <HoldingCard
            key={position.launchAddress}
            position={position}
            token={token}
            solPrice={solPrice}
          />
        );
      })}
    </div>
  );
}

interface HoldingCardProps {
  position: Position;
  token: Token | null | undefined;
  solPrice: number;
}

function HoldingCard({ position, token, solPrice }: HoldingCardProps) {
  // Calculate progress using USD-based target
  const progress = token ? calculateProgress(token.lockedBasis, solPrice) : 0;

  // V7: Simplified - only show total shares and total basis
  // No locked/unlocked breakdown since all non-seed shares unlock at graduation
  const totalShares = position.totalShares ?? (position.lockedShares + position.unlockedShares);
  const totalBasis = position.totalBasis ?? (position.lockedBasis + position.unlockedBasis);

  if (position.hasClaimedRefund) {
    return (
      <Card className="border-dashed bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden grayscale">
                {token?.image ? (
                  <img
                    src={token.image}
                    alt={token.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-lg">🪙</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-muted-foreground line-through">
                    {token?.name ?? "Unknown"}
                  </span>
                  <Badge variant="outline" className="text-muted-foreground">
                    Refunded
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span>{totalBasis.toFixed(4)} SOL returned to wallet</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href={`/token/${position.launchAddress}`}>
      <Card className="hover:border-primary transition-colors cursor-pointer">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                {token?.image ? (
                  <img
                    src={token.image}
                    alt={token.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-lg">🪙</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">
                    {token?.name ?? "Loading..."}
                  </span>
                  {token?.ticker && (
                    <Badge variant="secondary" className="font-mono">
                      ${token.ticker}
                    </Badge>
                  )}
                  {token?.status && (
                    <Badge variant={statusColors[token.status] ?? "secondary"}>
                      {token.status}
                    </Badge>
                  )}
                </div>
                {/* V7: Simplified - show only total shares and basis */}
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                  <span className="font-mono">
                    {totalShares.toLocaleString()} shares
                  </span>
                  <Separator
                    orientation="vertical"
                    className="h-4 hidden sm:block"
                  />
                  <span className="font-mono text-primary">
                    {totalBasis.toFixed(4)} SOL
                    <span className="text-xs ml-1">
                      ({formatUSD(totalBasis * solPrice)})
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right w-full sm:w-36 shrink-0">
              <Progress
                value={progress}
                className="h-2"
                aria-label={`Graduation progress: ${progress.toFixed(0)} percent`}
              />
              <span className="text-xs text-muted-foreground mt-1 block">
                {progress.toFixed(0)}% to graduation
              </span>
            </div>
          </div>

          {/* V7 REMOVED: Locked/Unlocked breakdown section
           * In V7, all non-seed shares unlock immediately at graduation
           * Only creator seed shares vest over 42 days
           * This is handled separately in the Vesting components
           */}
        </CardContent>
      </Card>
    </Link>
  );
}

function HoldingsListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="w-32">
                <Skeleton className="h-2 w-full mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
