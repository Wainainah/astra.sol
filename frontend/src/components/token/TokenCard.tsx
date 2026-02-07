/**
 * TokenCard Component - Astra Protocol V7
 *
 * Grid card for token list:
 * - Name, symbol, image
 * - Market cap (not locked/unlocked basis)
 * - Graduation progress bar
 * - Holders count
 * - Remove locked/unlocked display
 */

"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  Users,
  Clock,
  Zap,
  Award,
  ExternalLink,
  ImageOff,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Token } from "@/lib/api-types";
import { GRADUATION_MARKET_CAP_USD } from "@/lib/constants";
import { useState } from "react";

interface TokenCardProps {
  token: Token;
  className?: string;
}

export function TokenCard({ token, className = "" }: TokenCardProps) {
  const [imageError, setImageError] = useState(false);

  // Calculate graduation progress
  const graduationProgress = Math.min(
    100,
    (token.marketCapUsd / GRADUATION_MARKET_CAP_USD) * 100
  );

  // Get status badge
  const getStatusBadge = () => {
    switch (token.status) {
      case "graduated":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <Award className="w-3 h-3 mr-1" />
            Graduated
          </Badge>
        );
      case "refunding":
        return (
          <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">
            Refunding
          </Badge>
        );
      default:
        if (graduationProgress >= 90) {
          return (
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              <Zap className="w-3 h-3 mr-1" />
              Final Stretch
            </Badge>
          );
        }
        if (graduationProgress >= 50) {
          return (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              Building
            </Badge>
          );
        }
        return (
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            Active
          </Badge>
        );
    }
  };

  // Format age
  const formatAge = (hours: number) => {
    if (hours < 1) return "Just now";
    if (hours < 24) return `${Math.floor(hours)}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w`;
  };

  // Get progress color
  const getProgressColor = () => {
    if (token.status === "graduated") return "bg-emerald-500";
    if (graduationProgress >= 75) return "bg-cyan-500";
    if (graduationProgress >= 50) return "bg-blue-500";
    if (graduationProgress >= 25) return "bg-purple-500";
    return "bg-amber-500";
  };

  return (
    <TooltipProvider>
      <Link href={`/token/${token.address}`}>
        <Card
          className={`group bg-slate-950 border-slate-800 hover:border-slate-700 
            transition-all duration-300 cursor-pointer overflow-hidden
            hover:shadow-lg hover:shadow-cyan-500/10 ${className}`}
        >
          {/* Top gradient accent */}
          <div
            className={`h-1 bg-gradient-to-r ${
              token.status === "graduated"
                ? "from-emerald-500 to-cyan-500"
                : "from-purple-500 via-pink-500 to-cyan-500"
            }`}
          />

          <div className="p-4 space-y-4">
            {/* Header: Image, Name, Symbol */}
            <div className="flex items-start gap-3">
              {/* Token Image */}
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0">
                {!imageError && token.image ? (
                  <Image
                    src={token.image}
                    alt={token.name}
                    fill
                    className="object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-cyan-900/50">
                    <span className="text-xl">
                      {token.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Name and Symbol */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-100 truncate">
                    {token.name}
                  </h3>
                  <ExternalLink className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-slate-400 text-sm font-mono">
                  ${token.ticker}
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex-shrink-0">{getStatusBadge()}</div>
            </div>

            {/* Market Cap */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Market Cap</span>
              <div className="text-right">
                <div className="text-slate-100 font-mono font-semibold">
                  ${token.marketCapUsd.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </div>
              </div>
            </div>

            {/* Graduation Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  To Graduation
                </span>
                <span
                  className={`font-mono ${
                    token.status === "graduated"
                      ? "text-emerald-400"
                      : "text-cyan-400"
                  }`}
                >
                  {token.status === "graduated"
                    ? "Complete"
                    : `${graduationProgress.toFixed(1)}%`}
                </span>
              </div>

              {/* Progress Bar */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Progress
                      value={
                        token.status === "graduated" ? 100 : graduationProgress
                      }
                      className="h-2 bg-slate-800"
                    />
                    <div
                      className={`absolute top-0 bottom-0 left-0 transition-all duration-500 ${getProgressColor()}`}
                      style={{
                        width: `${
                          token.status === "graduated"
                            ? 100
                            : graduationProgress
                        }%`,
                        borderRadius: "2px",
                      }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
                  <p>
                    {token.status === "graduated"
                      ? "Token has graduated to AMM"
                      : `$${token.marketCapUsd.toLocaleString()} / $${GRADUATION_MARKET_CAP_USD.toLocaleString()}`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
              <div className="flex items-center gap-1 text-slate-400 text-xs">
                <Users className="w-3 h-3" />
                <span>{token.holders} holders</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500 text-xs">
                <Clock className="w-3 h-3" />
                <span>{formatAge(token.ageHours)}</span>
              </div>
            </div>

            {/* Creator Badge (if applicable) */}
            {token.topHolderPct && token.topHolderPct > 10 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-amber-400 text-xs bg-amber-500/10 rounded px-2 py-1 border border-amber-500/20">
                    <Zap className="w-3 h-3" />
                    <span>Top holder {token.topHolderPct.toFixed(1)}%</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
                  <p>
                    Top holder concentration is {(token.topHolderPct).toFixed(1)}%
                    - must be under 10% for graduation
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </Card>
      </Link>
    </TooltipProvider>
  );
}

// Skeleton loading state
export function TokenCardSkeleton() {
  return (
    <Card className="bg-slate-950 border-slate-800 overflow-hidden">
      <div className="h-1 bg-slate-800" />
      <div className="p-4 space-y-4">
        {/* Header Skeleton */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-24 bg-slate-900 rounded animate-pulse" />
            <div className="h-4 w-12 bg-slate-900 rounded animate-pulse" />
          </div>
          <div className="h-6 w-16 bg-slate-900 rounded animate-pulse" />
        </div>

        {/* Market Cap Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-20 bg-slate-900 rounded animate-pulse" />
          <div className="h-5 w-16 bg-slate-900 rounded animate-pulse" />
        </div>

        {/* Progress Skeleton */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 bg-slate-900 rounded animate-pulse" />
            <div className="h-4 w-12 bg-slate-900 rounded animate-pulse" />
          </div>
          <div className="h-2 bg-slate-900 rounded animate-pulse" />
        </div>

        {/* Footer Skeleton */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
          <div className="h-4 w-20 bg-slate-900 rounded animate-pulse" />
          <div className="h-4 w-12 bg-slate-900 rounded animate-pulse" />
        </div>
      </div>
    </Card>
  );
}
