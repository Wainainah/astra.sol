"use client";

/**
 * Home Page - Astra Protocol V7
 * 
 * Features:
 * - Hero section with stats
 * - Token grid using TokenCard
 * - Filters/sorting
 * - Load more pagination
 */

import { useState, useEffect, useCallback } from "react";
import { TokenCard, TokenCardSkeleton } from "@/components/token/TokenCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  Sparkles,
  Rocket,
  Search,
  Filter,
  Loader2,
  ChevronDown,
  Zap,
} from "lucide-react";
import type { Token, TokenStatus } from "@/lib/api-types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "most_funded", label: "Most Funded" },
  { value: "closest_to_graduation", label: "Closest to Graduation" },
];

const STATUS_FILTERS: { value: TokenStatus | "all"; label: string }[] = [
  { value: "all", label: "All Tokens" },
  { value: "active", label: "Active" },
  { value: "graduated", label: "Graduated" },
  { value: "refunding", label: "Refunding" },
];

export default function HomePage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [sortBy, setSortBy] = useState("newest");
  const [statusFilter, setStatusFilter] = useState<TokenStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch tokens
  const fetchTokens = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: currentOffset.toString(),
        sort: sortBy,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/tokens?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch tokens");
      }

      const data = await response.json();

      if (reset) {
        setTokens(data.tokens);
        setOffset(PAGE_SIZE);
      } else {
        setTokens((prev) => [...prev, ...data.tokens]);
        setOffset((prev) => prev + PAGE_SIZE);
      }

      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Error fetching tokens:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [offset, sortBy, statusFilter, searchQuery]);

  // Initial load
  useEffect(() => {
    fetchTokens(true);
  }, [sortBy, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        fetchTokens(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLoadMore = () => {
    fetchTokens(false);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/50">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-cyan-500/10 to-purple-500/10 blur-3xl" />
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black,transparent)]" />
        </div>

        <div className="relative px-6 py-12 md:py-16 lg:py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Badge
                variant="outline"
                className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                V7 Live
              </Badge>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              >
                <Zap className="w-3 h-3 mr-1" />
                Mainnet
              </Badge>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Fair Token Launches
              </span>
              <br />
              <span className="text-slate-100">on Solana</span>
            </h1>

            <p className="text-lg text-slate-400 mb-6 max-w-2xl">
              Create and trade tokens with transparent bonding curves. 
              No locked shares, clear graduation mechanics, and fair economics for everyone.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
                asChild
              >
                <a href="/create">
                  <Rocket className="w-4 h-4 mr-2" />
                  Launch Token
                </a>
              </Button>
              <Button size="lg" variant="outline" className="border-slate-700" asChild>
                <a href="#tokens">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Explore Tokens
                </a>
              </Button>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {[
              { label: "Total Tokens", value: "1,247", color: "cyan" },
              { label: "Graduated", value: "89", color: "emerald" },
              { label: "Total Volume", value: "$2.4M", color: "purple" },
              { label: "Active Users", value: "8.5K", color: "pink" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/50"
              >
                <p className="text-2xl font-bold font-mono text-slate-100">
                  {stat.value}
                </p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters & Search */}
      <section id="tokens" className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100">Tokens</h2>
            <Badge variant="outline" className="border-slate-700 text-slate-400">
              {tokens.length}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:flex-none min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-800"
              />
            </div>

            {/* Status filter */}
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as TokenStatus | "all")}
            >
              <SelectTrigger className="w-[140px] bg-slate-900/50 border-slate-800">
                <Filter className="w-4 h-4 mr-2 text-slate-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-slate-800">
                {STATUS_FILTERS.map((filter) => (
                  <SelectItem
                    key={filter.value}
                    value={filter.value}
                    className="text-slate-300 focus:bg-slate-900 focus:text-slate-100"
                  >
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-slate-900/50 border-slate-800">
                <TrendingUp className="w-4 h-4 mr-2 text-slate-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-slate-800">
                {SORT_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-slate-300 focus:bg-slate-900 focus:text-slate-100"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Token Grid */}
      <section>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <TokenCardSkeleton key={i} />
            ))}
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              No tokens found
            </h3>
            <p className="text-slate-500">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tokens.map((token) => (
                <TokenCard key={token.address} token={token} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="border-slate-700 text-slate-300 hover:bg-slate-900"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Load More
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
