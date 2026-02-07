"use client";

/**
 * Portfolio Page - Astra Protocol V7
 * 
 * Features:
 * - PortfolioSummary cards
 * - HoldingsTable
 * - TransactionHistory
 * - Empty state if no positions
 */

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

import { PortfolioSummary, PortfolioSummaryData } from "@/components/portfolio/PortfolioSummary";
import { HoldingsTable, PortfolioHolding } from "@/components/portfolio/HoldingsTable";
import {
  TransactionHistory,
  Transaction,
} from "@/components/portfolio/TransactionHistory";
import { EmptyPortfolio } from "@/components/portfolio/EmptyPortfolio";
import { PortfolioSkeleton } from "@/components/portfolio/PortfolioSkeleton";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import {
  Wallet,
  TrendingUp,
  History,
  Package,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useSolPrice } from "@/hooks/useSolPrice";
import { cn } from "@/lib/utils";

// Portfolio Stats Card for top of page
function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
  color = "blue",
}: {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  color?: "blue" | "purple" | "emerald" | "amber";
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  return (
    <Card className="bg-slate-950 border-slate-800 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">{title}</p>
            <p className="text-2xl font-bold font-mono text-slate-100">{value}</p>
            {subValue && <p className="text-sm text-slate-500 mt-1">{subValue}</p>}
          </div>
          <div className={cn("p-3 rounded-xl border", colorClasses[color])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PortfolioPage() {
  const { publicKey, connected } = useWallet();
  const { price: solPriceUsd } = useSolPrice();

  const [summary, setSummary] = useState<PortfolioSummaryData | null>(null);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("holdings");

  // Fetch portfolio data
  const fetchPortfolioData = useCallback(async () => {
    if (!publicKey) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [portfolioRes, txRes] = await Promise.all([
        fetch(`/api/portfolio?user=${publicKey.toBase58()}`),
        fetch(`/api/users/${publicKey.toBase58()}/transactions?limit=20`),
      ]);

      if (portfolioRes.ok) {
        const portfolioData = await portfolioRes.json();
        setSummary({
          totalValueSol: portfolioData.summary.totalValueSol,
          totalValueUsd: portfolioData.summary.totalValueUsd,
          totalInvestedSol: portfolioData.summary.totalCostBasisSol,
          totalInvestedUsd: portfolioData.summary.totalCostBasisUsd,
          totalUnrealizedPnlSol: portfolioData.summary.totalUnrealizedPnlSol,
          totalUnrealizedPnlUsd: portfolioData.summary.totalUnrealizedPnlUsd,
          totalUnrealizedPnlPercent: portfolioData.summary.totalUnrealizedPnlPercent,
          totalPositions: portfolioData.summary.totalPositions,
          graduatedPositions: portfolioData.holdings.filter((h: PortfolioHolding) => h.status === "graduated").length,
          activePositions: portfolioData.holdings.filter((h: PortfolioHolding) => h.status === "active").length,
        });
        setHoldings(portfolioData.holdings);
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions);
      }
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  // Handle sell action
  const handleSell = (holding: PortfolioHolding) => {
    // Navigate to token page with sell tab open
    window.location.href = `/token/${holding.launchAddress}?action=sell`;
  };

  // Handle claim action
  const handleClaim = (holding: PortfolioHolding) => {
    // Open claim modal or navigate to claim page
    console.log("Claim", holding);
  };

  // Not connected state
  if (!connected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Portfolio</h1>
          <p className="text-slate-500 mt-1">
            Track your positions and trading history
          </p>
        </div>

        <Card className="bg-slate-950 border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center mb-6">
              <Wallet className="w-10 h-10 text-slate-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-300 mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-slate-500 text-center max-w-md mb-6">
              Connect your Solana wallet to view your portfolio, track your positions,
              and manage your investments.
            </p>
            <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-purple-600">
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Portfolio</h1>
          <p className="text-slate-500 mt-1">Loading your positions...</p>
        </div>
        <PortfolioSkeleton />
      </div>
    );
  }

  // Empty portfolio
  if (!summary || summary.totalPositions === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Portfolio</h1>
          <p className="text-slate-500 mt-1">
            Your investment dashboard
          </p>
        </div>
        <EmptyPortfolio />
      </div>
    );
  }

  const hasGraduated = holdings.some((h) => h.status === "graduated");
  const hasActive = holdings.some((h) => h.status === "active");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Portfolio</h1>
          <p className="text-slate-500 mt-1">
            Track your positions and performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="bg-slate-900 border-slate-700 text-slate-400"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            {publicKey && (
              <span className="font-mono">
                {publicKey.toBase58().slice(0, 4)}...
                {publicKey.toBase58().slice(-4)}
              </span>
            )}
          </Badge>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              Explore Tokens
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <PortfolioSummary summary={summary} solPriceUsd={solPriceUsd} />
      )}

      {/* Detailed View Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="holdings" className="gap-2">
            <Package className="w-4 h-4" />
            Holdings
            <Badge variant="secondary" className="ml-1 text-xs">
              {holdings.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
          {hasGraduated && (
            <TabsTrigger value="claims" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Claims
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="holdings" className="mt-6">
          {/* Filters for holdings */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant="outline" size="sm" className="border-slate-700">
              All
            </Button>
            {hasActive && (
              <Button variant="ghost" size="sm" className="text-amber-400">
                Active
              </Button>
            )}
            {hasGraduated && (
              <Button variant="ghost" size="sm" className="text-emerald-400">
                Graduated
              </Button>
            )}
          </div>

          {/* Holdings Table */}
          <HoldingsTable
            holdings={holdings}
            onSell={handleSell}
            onClaim={handleClaim}
            solPriceUsd={solPriceUsd}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="bg-slate-950 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionHistory
                transactions={transactions}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {hasGraduated && (
          <TabsContent value="claims" className="mt-6">
            <Card className="bg-slate-950 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  Claimable Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {holdings
                    .filter((h) => h.status === "graduated" && !h.hasClaimedTokens)
                    .map((holding) => (
                      <div
                        key={holding.launchAddress}
                        className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-800"
                      >
                        <div>
                          <h4 className="font-semibold text-slate-200">
                            {holding.tokenName}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {holding.shares.toLocaleString()} shares available to claim
                          </p>
                        </div>
                        <Button
                          onClick={() => handleClaim(holding)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Claim Tokens
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
