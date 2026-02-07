/**
 * BondingCurveProgress Component - Astra Protocol V7
 *
 * V7 REDESIGN: Shows progress to $42K market cap (not 800M shares)
 * - Progress bar: Current / $42K
 * - Current market cap in USD
 * - Current share price
 * - Estimated shares at graduation (varies by SOL price)
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DollarSign,
  Coins,
  Target,
  Zap,
  ArrowRight,
  Info,
  Rocket,
} from "lucide-react";
import type { Token } from "@/lib/api-types";
import { GRADUATION_MARKET_CAP_USD } from "@/lib/constants";
import { getSharePrice, buyQuote } from "@/lib/curve";
import { useMemo } from "react";

interface BondingCurveProgressProps {
  token: Token;
  solPriceUsd: number;
  className?: string;
}

export function BondingCurveProgress({
  token,
  solPriceUsd,
  className = "",
}: BondingCurveProgressProps) {
  // Calculate current metrics
  const sharePriceLamports = getSharePrice(token.totalShares);
  const sharePriceSol = sharePriceLamports / 1e9;
  const sharePriceUsd = sharePriceSol * solPriceUsd;

  // Graduation progress
  const graduationProgress = Math.min(
    100,
    (token.marketCapUsd / GRADUATION_MARKET_CAP_USD) * 100
  );
  const remainingToGraduation = Math.max(
    0,
    GRADUATION_MARKET_CAP_USD - token.marketCapUsd
  );

  // Estimate shares at graduation
  // This varies by SOL price - higher SOL price = fewer shares needed
  const estimatedSharesAtGraduation = useMemo(() => {
    // Working backwards from target market cap
    // Market Cap = totalSol * solPriceUsd / 1e9
    // So totalSol needed = Market Cap * 1e9 / solPriceUsd
    const solNeededForGraduation =
      (GRADUATION_MARKET_CAP_USD * 1e9) / solPriceUsd;

    // Binary search to find share count that would result in this SOL amount
    let low = token.totalShares;
    let high = token.totalShares * 10;
    let iterations = 0;
    const maxIterations = 50;

    while (iterations < maxIterations) {
      const mid = Math.floor((low + high) / 2);
      const solAtMid = buyQuote(mid - token.totalShares, token.totalShares);

      if (solAtMid < solNeededForGraduation) {
        low = mid;
      } else {
        high = mid;
      }

      if (high - low <= 1) break;
      iterations++;
    }

    return high;
  }, [token.totalShares, solPriceUsd]);

  // Current phase
  const getPhase = () => {
    if (graduationProgress >= 100) return { label: "Ready", color: "emerald" };
    if (graduationProgress >= 75)
      return { label: "Final Stretch", color: "cyan" };
    if (graduationProgress >= 50) return { label: "Halfway", color: "blue" };
    if (graduationProgress >= 25) return { label: "Building", color: "purple" };
    return { label: "Early", color: "amber" };
  };

  const phase = getPhase();

  // Color classes based on phase
  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> =
      {
        emerald: {
          bg: "bg-emerald-500",
          text: "text-emerald-400",
          border: "border-emerald-500/30",
        },
        cyan: {
          bg: "bg-cyan-500",
          text: "text-cyan-400",
          border: "border-cyan-500/30",
        },
        blue: {
          bg: "bg-blue-500",
          text: "text-blue-400",
          border: "border-blue-500/30",
        },
        purple: {
          bg: "bg-purple-500",
          text: "text-purple-400",
          border: "border-purple-500/30",
        },
        amber: {
          bg: "bg-amber-500",
          text: "text-amber-400",
          border: "border-amber-500/30",
        },
      };
    return colors[color] || colors.purple;
  };

  const colors = getColorClasses(phase.color);

  return (
    <TooltipProvider>
      <Card
        className={`bg-slate-950 border-slate-800 overflow-hidden ${className}`}
      >
        {/* Animated gradient border top */}
        <div
          className={`h-1 bg-gradient-to-r from-${phase.color}-500 via-purple-500 to-cyan-500`}
          style={{
            background: `linear-gradient(90deg, var(--${phase.color}-500), #a855f7, #06b6d4)`,
          }}
        />

        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <TrendingUp className={`w-5 h-5 ${colors.text}`} />
              Bonding Curve
            </CardTitle>
            <Badge
              variant="outline"
              className={`${colors.border} ${colors.text}`}
            >
              <Zap className="w-3 h-3 mr-1" />
              {phase.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Main Progress Section */}
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-sm flex items-center gap-1">
                <Target className="w-4 h-4" />
                Graduation Target
              </span>
              <span className="text-slate-100 font-mono font-semibold">
                ${GRADUATION_MARKET_CAP_USD.toLocaleString()}
              </span>
            </div>

            {/* Large Progress Display */}
            <div className="text-center py-4">
              <div className={`text-4xl font-bold ${colors.text} font-mono`}>
                {graduationProgress.toFixed(1)}%
              </div>
              <div className="text-slate-500 text-sm mt-1">
                to graduation
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative mb-3">
              <Progress
                value={graduationProgress}
                className="h-4 bg-slate-800"
              />
              {/* Milestone markers */}
              <div className="absolute top-0 bottom-0 left-1/4 w-0.5 bg-slate-700/50" />
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-700/50" />
              <div className="absolute top-0 bottom-0 left-3/4 w-0.5 bg-slate-700/50" />
            </div>

            {/* Progress markers labels */}
            <div className="flex justify-between text-xs text-slate-600">
              <span>$0</span>
              <span>$10K</span>
              <span>$21K</span>
              <span>$31K</span>
              <span>$42K</span>
            </div>
          </div>

          {/* Current Market Cap */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400 text-xs">Market Cap</span>
              </div>
              <div className="text-slate-100 font-mono font-semibold">
                ${token.marketCapUsd.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
              <div className="text-slate-500 text-xs">
                {(token.marketCapUsd / solPriceUsd).toFixed(2)} SOL
              </div>
            </div>

            <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400 text-xs">Share Price</span>
              </div>
              <div className="text-slate-100 font-mono font-semibold">
                ${sharePriceUsd.toFixed(6)}
              </div>
              <div className="text-slate-500 text-xs">
                {sharePriceSol.toFixed(8)} SOL
              </div>
            </div>
          </div>

          {/* Estimated at Graduation */}
          <div className="bg-gradient-to-r from-purple-900/20 to-cyan-900/20 rounded-lg p-3 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Rocket className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-medium">
                Estimated at Graduation
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-slate-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-xs">
                  <p>
                    Estimated total shares when market cap reaches $42K. Varies
                    based on SOL price - higher SOL price means fewer shares
                    needed.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-400 text-xs">Est. Total Shares</div>
                <div className="text-cyan-400 font-mono font-semibold">
                  {estimatedSharesAtGraduation.toLocaleString()}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="text-right">
                <div className="text-slate-400 text-xs">SOL Price</div>
                <div className="text-slate-200 font-mono">
                  ${solPriceUsd.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Remaining to Graduation */}
          {remainingToGraduation > 0 && (
            <div className="flex items-center justify-between py-2 px-3 bg-slate-900/30 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-sm">
                Remaining to Graduate
              </span>
              <div className="text-right">
                <div className="text-cyan-400 font-mono font-semibold">
                  ${remainingToGraduation.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div className="text-slate-500 text-xs">
                  {(remainingToGraduation / solPriceUsd).toFixed(2)} SOL
                </div>
              </div>
            </div>
          )}

          {/* Status message */}
          {graduationProgress >= 100 ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
              <Rocket className="w-4 h-4" />
              <span>Ready for graduation! All criteria must be met.</span>
            </div>
          ) : graduationProgress >= 75 ? (
            <div className="flex items-center gap-2 text-cyan-400 text-sm bg-cyan-500/10 rounded-lg p-3 border border-cyan-500/20">
              <Zap className="w-4 h-4" />
              <span>Final stretch! The bonding curve is almost complete.</span>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
