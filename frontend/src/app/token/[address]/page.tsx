"use client";

/**
 * Token Detail Page - Astra Protocol V7
 * 
 * Features:
 * - Token header (name, image, market cap)
 * - BondingCurveProgress component
 * - GraduationGates component
 * - TradePanel (Buy/Sell)
 * - PositionSummary (if user has position)
 * - HoldersList
 * - Activity feed
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import Link from "next/link";

import { TokenCard } from "@/components/token/TokenCard";
import { BondingCurveProgress } from "@/components/token/BondingCurveProgress";
import { GraduationGates } from "@/components/token/GraduationGates";
import { PositionSummary } from "@/components/token/PositionSummary";
import { HoldersList, HoldersListSkeleton } from "@/components/token/HoldersList";
import { TradePanel } from "@/components/trade/TradePanel";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  ArrowLeft,
  ExternalLink,
  Copy,
  TrendingUp,
  Award,
  AlertTriangle,
  Zap,
  Share2,
  Activity,
  MessageSquare,
  Users,
} from "lucide-react";

import type {
  Token,
  Position,
  GraduationGates as GraduationGatesType,
  Transaction,
} from "@/lib/api-types";
import { cn, truncate, formatNumber } from "@/lib/utils";
import { useSolPrice } from "@/hooks/useSolPrice";

// Activity feed component
function ActivityFeed({
  transactions,
  isLoading,
}: {
  transactions: Transaction[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <div
          key={tx.signature}
          className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30 border border-slate-800/50"
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                tx.type === "buy" && "bg-emerald-500/20 text-emerald-400",
                tx.type === "sell" && "bg-rose-500/20 text-rose-400",
                tx.type === "create" && "bg-cyan-500/20 text-cyan-400"
              )}
            >
              {tx.type === "buy" && <TrendingUp className="w-4 h-4" />}
              {tx.type === "sell" && <TrendingUp className="w-4 h-4 rotate-180" />}
              {tx.type === "create" && <Zap className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200 capitalize">
                {tx.type}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(tx.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            {tx.sharesAmount && (
              <p className="text-sm font-mono text-slate-200">
                {formatNumber(tx.sharesAmount, 0)} shares
              </p>
            )}
            {tx.solAmount && (
              <p className="text-xs text-slate-500">
                {(tx.solAmount / 1e9).toFixed(4)} SOL
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TokenDetailPage() {
  const params = useParams();
  const address = params.address as string;
  const { publicKey } = useWallet();
  const { price: solPriceUsd, isLoading: isPriceLoading } = useSolPrice();

  const [token, setToken] = useState<Token | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [gates, setGates] = useState<GraduationGatesType | null>(null);
  const [holders, setHolders] = useState<Position[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [relatedTokens, setRelatedTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch token data
  const fetchTokenData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tokenRes, holdersRes, txRes] = await Promise.all([
        fetch(`/api/tokens/${address}`),
        fetch(`/api/tokens/${address}/holders`),
        fetch(`/api/tokens/${address}/transactions`),
      ]);

      if (!tokenRes.ok) throw new Error("Failed to fetch token");

      const tokenData = await tokenRes.json();
      setToken(tokenData);
      setGates(tokenData.graduationGates);

      if (holdersRes.ok) {
        const holdersData = await holdersRes.json();
        setHolders(holdersData.holders);
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions);
      }

      // Fetch user position if wallet connected
      if (publicKey) {
        const positionRes = await fetch(
          `/api/tokens/${address}/position?user=${publicKey.toBase58()}`
        );
        if (positionRes.ok) {
          const positionData = await positionRes.json();
          setPosition(positionData);
        }
      }

      // Fetch related tokens
      const relatedRes = await fetch(
        `/api/tokens?status=${tokenData.status}&limit=4&exclude=${address}`
      );
      if (relatedRes.ok) {
        const relatedData = await relatedRes.json();
        setRelatedTokens(relatedData.tokens);
      }
    } catch (error) {
      console.error("Error fetching token data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [address, publicKey]);

  useEffect(() => {
    fetchTokenData();
  }, [fetchTokenData]);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTradeSuccess = () => {
    // Refresh data after trade
    fetchTokenData();
  };

  if (isLoading || !token) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const isGraduated = token.status === "graduated";
  const isRefunding = token.status === "refunding";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="text-slate-400">
        <Link href="/">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Explore
        </Link>
      </Button>

      {/* Token Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Token Image */}
        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-800 flex-shrink-0">
          {token.image ? (
            <Image
              src={token.image}
              alt={token.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-cyan-900/50">
              <span className="text-4xl font-bold">
                {token.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {isGraduated && (
            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
              <Award className="w-12 h-12 text-emerald-400" />
            </div>
          )}
        </div>

        {/* Token Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-100">{token.name}</h1>
            <span className="text-xl text-slate-500 font-mono">
              ${token.ticker}
            </span>
            {isGraduated ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <Award className="w-3 h-3 mr-1" />
                Graduated
              </Badge>
            ) : isRefunding ? (
              <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Refunding
              </Badge>
            ) : (
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                <Zap className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
          </div>

          {/* Contract Address */}
          <div className="flex items-center gap-2 mb-4">
            <code className="text-sm text-slate-400 font-mono bg-slate-900 px-2 py-1 rounded">
              {truncate(address, 8, 8)}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500"
              onClick={handleCopyAddress}
            >
              {copied ? (
                <span className="text-emerald-400 text-xs">✓</span>
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" asChild>
              <a
                href={`https://solscan.io/token/${address}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-slate-500">Market Cap</p>
              <p className="text-2xl font-bold font-mono text-slate-100">
                ${token.marketCapUsd.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Holders</p>
              <p className="text-2xl font-bold font-mono text-slate-100">
                {token.holders.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Age</p>
              <p className="text-2xl font-bold font-mono text-slate-100">
                {Math.floor(token.ageHours / 24)}d
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Shares</p>
              <p className="text-2xl font-bold font-mono text-slate-100">
                {token.totalShares.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs for different views */}
          <Tabs defaultValue="curve" className="w-full">
            <TabsList className="bg-slate-900 border border-slate-800">
              <TabsTrigger value="curve">Bonding Curve</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            <TabsContent value="curve" className="mt-4 space-y-6">
              {/* Bonding Curve Progress */}
              {solPriceUsd > 0 && (
                <BondingCurveProgress
                  token={token}
                  solPriceUsd={solPriceUsd}
                />
              )}

              {/* Graduation Gates */}
              {gates && <GraduationGates gates={gates} />}

              {/* Holders List */}
              <Card className="bg-slate-950 border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    Holders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {holders.length > 0 ? (
                    <HoldersList
                      holders={holders}
                      totalShares={token.totalShares}
                      pageSize={10}
                    />
                  ) : (
                    <HoldersListSkeleton />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card className="bg-slate-950 border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityFeed
                    transactions={transactions}
                    isLoading={isLoading}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <Card className="bg-slate-950 border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-cyan-400" />
                    Comments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Comments coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Related Tokens */}
          {relatedTokens.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-100">
                Similar Tokens
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedTokens.map((t) => (
                  <TokenCard key={t.address} token={t} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Trading */}
        <div className="space-y-6">
          {/* Trade Panel */}
          <TradePanel
            token={token}
            position={position}
            onTradeSuccess={handleTradeSuccess}
          />

          {/* User Position Summary */}
          {position && position.shares > 0 && solPriceUsd > 0 && (
            <PositionSummary
              position={position}
              token={token}
              solPriceUsd={solPriceUsd}
            />
          )}

          {/* Token Info Card */}
          <Card className="bg-slate-950 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm text-slate-500 uppercase tracking-wider">
                Token Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Creator</span>
                <a
                  href={`https://solscan.io/account/${token.creator}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-cyan-400 hover:underline"
                >
                  {truncate(token.creator, 4, 4)}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created</span>
                <span className="text-slate-300">
                  {new Date(token.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total SOL</span>
                <span className="font-mono text-slate-300">
                  {(token.totalSol / 1e9).toFixed(4)} SOL
                </span>
              </div>
              {token.graduationProgress > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Progress</span>
                  <span className="font-mono text-cyan-400">
                    {token.graduationProgress.toFixed(1)}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
