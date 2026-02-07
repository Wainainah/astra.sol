"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TokenStatus } from "@/components/token/TokenCard";

// Lazy-load heavy chart components to reduce initial bundle size
const BondingCurveChart = dynamic(
  () =>
    import("@/components/token/BondingCurveChart").then(
      (mod) => mod.BondingCurveChart,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" />,
  },
);

const GraduationCelebration = dynamic(
  () =>
    import("@/components/token/GraduationCelebration").then(
      (mod) => mod.GraduationCelebration,
    ),
  { ssr: false },
);

interface TokenChartWrapperProps {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  initialStatus?: TokenStatus;
}

export function TokenChartWrapper({
  tokenAddress,
  tokenName,
  tokenSymbol,
  initialStatus = "active",
}: TokenChartWrapperProps) {
  const [showGraduationModal, setShowGraduationModal] = useState(false);
  const [status, setStatus] = useState<TokenStatus>(initialStatus);
  const [tokenMint, setTokenMint] = useState<string | undefined>(undefined);
  const prevGraduated = useRef<boolean | undefined>(undefined);

  // V7: Poll for graduation status from API
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/tokens/${tokenAddress}`);
        if (!response.ok) return;
        
        const data = await response.json();
        
        // Get token mint if graduated
        if (data.token?.mint) {
          setTokenMint(data.token.mint);
        }

        const isGraduated = data.token?.status === "graduated";
        const isRefunding = data.token?.status === "refunding";

        if (isGraduated && prevGraduated.current === false) {
          setShowGraduationModal(true);
          setStatus("graduated");
        } else if (isGraduated) {
          setStatus("graduated");
        } else if (isRefunding) {
          setStatus("refunding");
        }

        prevGraduated.current = isGraduated;
      } catch (error) {
        console.error("Error fetching launch status:", error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [tokenAddress]);

  const handleCloseGraduationModal = () => {
    setShowGraduationModal(false);
  };

  // Render based on status
  if (status === "refunding") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">This token did not graduate</p>
              <p className="text-sm mt-1">
                Refunds are processed automatically. Check your wallet.
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (status === "graduated") {
    const displayAddress = tokenMint || tokenAddress;
    const birdeyeUrl = `https://birdeye.so/token/${displayAddress}?chain=solana`;
    const dexscreenerUrl = `https://dexscreener.com/solana/${displayAddress}`;

    return (
      <>
        <GraduationCelebration
          open={showGraduationModal}
          onClose={handleCloseGraduationModal}
          tokenName={tokenName}
          tokenSymbol={tokenSymbol}
          tokenAddress={displayAddress}
        />
        <Card className="h-[500px] flex flex-col">
          <CardHeader className="pb-2 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Price Chart</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={birdeyeUrl} target="_blank" rel="noopener noreferrer">
                  Birdeye <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={dexscreenerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  DexScreener <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </div>
          </CardHeader>
          <div className="flex-1 w-full bg-black/50">
            <iframe
              src={`https://birdeye.so/tv-widget/${displayAddress}?chain=solana&viewMode=pair&chartType=CANDLE&chartInterval=15&chartTimezone=America%2FLos_Angeles&theme=dark`}
              width="100%"
              height="100%"
              style={{ border: "none" }}
              title={`${tokenSymbol} Chart`}
            />
          </div>
        </Card>
      </>
    );
  }

  // Active - show bonding curve chart
  return (
    <>
      <GraduationCelebration
        open={showGraduationModal}
        onClose={handleCloseGraduationModal}
        tokenName={tokenName}
        tokenSymbol={tokenSymbol}
        tokenAddress={tokenAddress}
      />
      <BondingCurveChart tokenAddress={tokenAddress} />
    </>
  );
}
