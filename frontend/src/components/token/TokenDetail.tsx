"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Copy, ExternalLink, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useAnchorProgram } from "@/hooks/useAnchorProgram";
import { fetchMetadata, getImageFromMetadata } from "@/lib/metadata";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { TradePanel } from "@/components/trade/TradePanel";
import { parseSolanaError } from "@/lib/solana-errors";
import type { TokenStatus } from "@/components/token/TokenCard";

import { PositionSummary } from "@/components/token/PositionSummary";
import { HoldersList } from "@/components/token/HoldersList";
import { ActivityFeed } from "@/components/token/ActivityFeed";
import { useWallet } from "@solana/wallet-adapter-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokenChartWrapper } from "@/components/token/TokenChartWrapper";

/**
 * Launch account data from Anchor program.
 * Matches the IDL types in astra.ts
 */
interface LaunchAccount {
  launchId: BN;
  creator: PublicKey;
  name: string;
  symbol: string;
  uri: string;
  totalLockedShares: BN;
  totalUnlockedShares: BN;
  totalLockedBasis: BN;
  totalUnlockedBasis: BN;
  creatorSeedShares: BN;
  creatorSeedBasis: BN;
  graduated: boolean;
  refundMode: boolean;
  tokenMint: PublicKey | null;
  poolAddress: PublicKey | null;
  vault: PublicKey | null;
  vestingStart: BN | null;
  creatorClaimedShares: BN;
  createdAt: BN;
  graduatedAt: BN | null;
  refundEnabledAt: BN | null;
  holderCount: number;
  creatorAccruedFees: BN;
  bump: number;
}

export function TokenDetail({ tokenAddress }: { tokenAddress: string }) {
  const [copied, setCopied] = useState(false);
  const { publicKey } = useWallet();

  // Solana State
  const { program } = useAnchorProgram();
  const [tokenData, setTokenData] = useState<LaunchAccount | null>(null);
  const [tokenImage, setTokenImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTokenData = useCallback(async () => {
    if (!program || !tokenAddress) return;

    try {
      setLoading(true);
      const pubkey = new PublicKey(tokenAddress);
      const account = await program.account.launch.fetch(pubkey);
      const launchAccount = account as unknown as LaunchAccount;
      setTokenData(launchAccount);
      setError(null);

      // Fetch token image from metadata URI
      if (launchAccount.uri) {
        try {
          const metadata = await fetchMetadata(launchAccount.uri);
          const imageUrl = getImageFromMetadata(metadata);
          setTokenImage(imageUrl);
        } catch (imgErr) {
          console.warn("Failed to fetch token image:", imgErr);
          setTokenImage(null);
        }
      }
    } catch (err: unknown) {
      console.error("Failed to fetch token details:", err);
      setError(err instanceof Error ? err : new Error(parseSolanaError(err)));
    } finally {
      setLoading(false);
    }
  }, [program, tokenAddress]);

  useEffect(() => {
    fetchTokenData();
    // Poll every 30s
    const interval = setInterval(fetchTokenData, 30000);
    return () => clearInterval(interval);
  }, [fetchTokenData]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(tokenAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Loading state
  if (loading && !tokenData) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardHeader>
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-8 w-48 mt-4" />
            <Skeleton className="h-4 w-32 mt-2" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !tokenData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tokens
        </Link>

        <Alert variant="destructive">
          <AlertDescription className="space-y-2">
            <p>Failed to load token data from blockchain.</p>
            <p className="text-xs font-mono">{error.message}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTokenData()}
            >
              <Loader2 className="h-3 w-3 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!tokenData) return null;

  // Parse Data
  const name = tokenData.name;
  const symbol = tokenData.symbol;
  const creator = tokenData.creator.toBase58();

  const graduated = tokenData.graduated;
  const refundEnabled = tokenData.refundMode;
  // Holder count from on-chain if available, otherwise estimate
  const holderCount = tokenData.holderCount || 1;

  const shortAddress = `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`;
  const shortCreator = `${creator.slice(0, 6)}...${creator.slice(-4)}`;
  const createdAt = tokenData.createdAt
    ? new Date(tokenData.createdAt.toNumber() * 1000)
    : null;

  const status: TokenStatus = graduated
    ? "graduated"
    : refundEnabled
      ? "refunding"
      : "active";

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tokens
      </Link>

      {/* Recently created notice */}
      <Alert className="mb-6 bg-blue-500/10 border-blue-500/30">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-600">
          <span className="font-medium">Live on Solana</span> — Data is live
          from the Devnet blockchain.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Token Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-3xl overflow-hidden">
                  {tokenImage ? (
                    <Image
                      src={tokenImage}
                      alt={name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    "🪙"
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-2xl">{name}</CardTitle>
                    <Badge variant="secondary" className="font-mono text-base">
                      ${symbol}
                    </Badge>
                    {status === "graduated" && (
                      <Badge className="bg-green-500">Graduated</Badge>
                    )}
                    {status === "refunding" && (
                      <Badge variant="destructive">Failed</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <span>Created by {shortCreator}</span>
                    <span>•</span>
                    <span>
                      {createdAt ? createdAt.toLocaleString() : "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="h-7 text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {copied ? "Copied!" : shortAddress}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-7 text-xs"
                    >
                      <a
                        href={`https://explorer.solana.com/address/${tokenAddress}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Solscan
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Chart Section */}
          <TokenChartWrapper
            tokenAddress={tokenAddress}
            tokenName={name}
            tokenSymbol={symbol}
            initialStatus={status}
          />

          {/* Tabs Section (Activity, Holders, etc.) */}
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="holders">Holders</TabsTrigger>
            </TabsList>
            <TabsContent value="activity" className="mt-4">
              <ActivityFeed tokenAddress={tokenAddress} />
            </TabsContent>
            <TabsContent value="holders" className="mt-4">
              <HoldersList tokenAddress={tokenAddress} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Trade Info */}
        <div className="space-y-6">
          <TradePanel
            tokenAddress={tokenAddress}
            tokenName={name}
            ticker={symbol}
            status={status}
            tokenMint={tokenData.tokenMint?.toBase58()}
          />

          {/* Position Summary */}
          {publicKey && (
            <PositionSummary
              tokenAddress={tokenAddress}
              userAddress={publicKey.toBase58()}
              tokenStatus={status}
            />
          )}

          {/* Stats Card - V7: Focus on Market Cap, no locked/unlocked */}
          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Market Cap</span>
                <span className="font-mono">$42,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Supply</span>
                <span className="font-mono">1,000,000,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Holders</span>
                <span>{holderCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={
                    status === "active"
                      ? "secondary"
                      : status === "graduated"
                        ? "default"
                        : "destructive"
                  }
                >
                  {status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
