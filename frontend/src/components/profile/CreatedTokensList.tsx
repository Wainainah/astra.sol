"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { getCreatedTokens } from "@/data/api";
import { useSolPrice } from "@/hooks/useSolPrice";
import {
  calculateProgress,
  calculateTargetSol,
  formatUSD,
  shortenAddress,
} from "@/lib/constants";
import { Rocket, AlertCircle, RefreshCw } from "lucide-react";
import Image from "next/image";

interface CreatedTokensListProps {
  creatorAddress: string;
}

export function CreatedTokensList({ creatorAddress }: CreatedTokensListProps) {
  const { price: solPrice } = useSolPrice();
  const targetSol = calculateTargetSol(solPrice);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["created-tokens", creatorAddress],
    queryFn: () => getCreatedTokens(creatorAddress),
    enabled: !!creatorAddress,
    staleTime: 30_000,
  });

  const tokens = data?.tokens ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg mb-2">Failed to load created tokens</p>
          <p className="text-sm text-muted-foreground mb-4">
            There was an error fetching your created tokens.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (tokens.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg font-medium mb-2">No tokens created yet</p>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Launch your first token and start building your community on Astra!
          </p>
          <Link href="/create">
            <Button>
              <Rocket className="h-4 w-4 mr-2" />
              Create Token
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tokens.map((token) => {
        const progress = calculateProgress(token.marketCapUsd);

        return (
          <Link key={token.address} href={`/token/${token.address}`}>
            <Card className="hover:border-primary transition-colors cursor-pointer group">
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Token Image */}
                    <div className="relative w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0">
                      {token.image ? (
                        <Image
                          src={token.image}
                          alt={token.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg bg-primary/10">
                          🪙
                        </div>
                      )}
                    </div>

                    {/* Token Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">
                          {token.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="font-mono shrink-0"
                        >
                          ${token.ticker}
                        </Badge>
                        <StatusBadge status={token.status} />
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>👥 {token.holders} holders</span>
                        <span>•</span>
                        <span className="font-mono text-xs">
                          {shortenAddress(token.address, 4)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="text-right w-48 shrink-0">
                    <Progress
                      value={progress}
                      className="h-2"
                      aria-label={`Graduation progress: ${progress.toFixed(0)} percent`}
                    />
                    <span className="text-xs text-muted-foreground mt-1 block font-mono">
                      {token.totalSol.toFixed(2)} / {targetSol.toFixed(0)}{" "}
                      SOL
                      <span className="text-xs ml-1">
                        ({progress.toFixed(0)}%)
                      </span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

// Helper component for status badge
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    active: { label: "Active", variant: "secondary" },
    graduated: { label: "Graduated", variant: "default" },
    refunding: { label: "Refunding", variant: "destructive" },
  };

  const config = statusConfig[status] || { label: status, variant: "outline" };

  return (
    <Badge variant={config.variant} className="shrink-0 text-xs">
      {config.label}
    </Badge>
  );
}
