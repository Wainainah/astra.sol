"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useClaimableItems, type ClaimableItem } from "@/hooks/useClaimableItems";
import { useClaim } from "@/hooks/useClaim";
import { Gift, RefreshCw, PartyPopper, Loader2 } from "lucide-react";
import { useState } from "react";

interface ClaimableSectionProps {
  userAddress: string;
}

/**
 * ClaimableSection Component (V7)
 * 
 * Displays graduated tokens and refunds available for claiming.
 * 
 * V7 PROPORTIONAL DISTRIBUTION:
 * - Graduated tokens show proportional token amounts, not 1:1
 * - tokensToReceive = (shares / totalSharesAtGraduation) * 800M
 * - This means users get a percentage of the 800M token pool based on their share ownership
 */
export function ClaimableSection({ userAddress }: ClaimableSectionProps) {
  const {
    graduatedItems,
    refundingItems,
    totalClaimable,
    isLoading,
    isError,
  } = useClaimableItems({
    userAddress,
  });

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <Skeleton className="h-16 w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || totalClaimable === 0) {
    return null;
  }

  return (
    <Card className="border-primary/50">
      <CardHeader className="pb-3">
        <Alert className="bg-primary/10 border-primary/30">
          <PartyPopper className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            You have {totalClaimable} item{totalClaimable > 1 ? "s" : ""} ready
            to claim!
          </AlertDescription>
        </Alert>
      </CardHeader>

      <CardContent className="space-y-4">
        {graduatedItems.map((item) => (
          <ClaimableItemCard key={item.launchAddress} item={item} />
        ))}

        {graduatedItems.length > 0 && refundingItems.length > 0 && (
          <Separator />
        )}

        {refundingItems.map((item) => (
          <ClaimableItemCard key={item.launchAddress} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Individual claimable item card
 * 
 * V7: Displays proportional token amounts for graduated tokens.
 * The tokensToReceive value is calculated as:
 * (userShares / totalSharesAtGraduation) * TOKENS_FOR_HOLDERS (800M)
 */
function ClaimableItemCard({ item }: { item: ClaimableItem }) {
  const isGraduated = item.type === "graduated";
  const [claiming, setClaiming] = useState(false);

  // Use the claim hook for graduated tokens
  const { claim, isPending } = useClaim({
    launchAddress: item.launchAddress,
    tokenMint: item.tokenMint,
  });

  const handleClaim = async () => {
    setClaiming(true);
    try {
      await claim();
    } finally {
      setClaiming(false);
    }
  };

  const isClaimPending = claiming || isPending;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🪙</span>
          <span className="font-semibold">{item.tokenName}</span>
          <Badge variant="secondary" className="font-mono">
            ${item.ticker}
          </Badge>
        </div>
        <Badge
          variant={isGraduated ? "default" : "destructive"}
          className={isGraduated ? "bg-green-500/10 text-green-500" : ""}
        >
          {isGraduated ? (
            <>
              <Gift className="h-3 w-3 mr-1" />
              GRADUATED
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3 mr-1" />
              REFUND
            </>
          )}
        </Badge>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        {isGraduated ? (
          <>
            <div>
              <p className="text-muted-foreground">Your shares</p>
              <p className="font-mono font-semibold">
                {item.shares?.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Tokens to receive</p>
              <p className="font-mono font-semibold text-primary">
                {item.tokensToReceive?.toLocaleString()} ${item.ticker}
              </p>
              <p className="text-xs text-muted-foreground">
                Proportional distribution
              </p>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-muted-foreground">Your basis</p>
              <p className="font-mono font-semibold">
                {((item.basisToReceive || 0) + (item.protocolFee || 0)).toFixed(4)} SOL
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Refund amount</p>
              <p className="font-mono font-semibold text-primary">
                {item.basisToReceive?.toFixed(4)} SOL
              </p>
              <p className="text-xs text-muted-foreground">
                (0.5% protocol fee: {item.protocolFee?.toFixed(4)} SOL)
              </p>
            </div>
          </>
        )}
      </div>

      {/* Action Button */}
      <Button
        className="w-full"
        variant={isGraduated ? "default" : "outline"}
        onClick={handleClaim}
        disabled={isClaimPending}
      >
        {isClaimPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : isGraduated ? (
          <Gift className="h-4 w-4 mr-2" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-2" />
        )}
        {isClaimPending
          ? "Claiming..."
          : isGraduated
            ? `Claim ${item.tokensToReceive?.toLocaleString()} $${item.ticker}`
            : `Claim ${item.basisToReceive?.toFixed(4)} SOL Refund`}
      </Button>
    </div>
  );
}
