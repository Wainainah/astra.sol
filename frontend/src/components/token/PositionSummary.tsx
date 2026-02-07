/**
 * PositionSummary Component - Astra Protocol V7
 *
 * Shows user's position in a token with:
 * - Shares owned
 * - Position value (current market value)
 * - Invested amount (original basis)
 * - Unrealized gains (paper gains)
 * - ROI %
 * - Ownership % of supply
 * - Estimated tokens at graduation
 * - Graduation countdown/progress
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Percent,
  Award,
  Clock,
  Info,
  Zap,
  GraduationCap,
} from "lucide-react";
import type { Position, PositionValue, Token } from "@/lib/api-types";
import { GRADUATION_MARKET_CAP_USD, TOKENS_FOR_HOLDERS } from "@/lib/constants";
import {
  getPositionValue,
  getOwnershipPercent,
  estimateTokensAtGraduation,
  getSharePrice,
} from "@/lib/curve";

interface PositionSummaryProps {
  position: Position;
  token: Token;
  solPriceUsd: number;
  className?: string;
}

export function PositionSummary({
  position,
  token,
  solPriceUsd,
  className = "",
}: PositionSummaryProps) {
  // Calculate position metrics
  const sharePrice = getSharePrice(token.totalShares);
  const sharePriceUsd = (sharePrice * solPriceUsd) / 1e9;

  // Current position value (what it would cost to buy these shares now)
  const positionValueSol =
    position.positionValue ??
    getPositionValue(position.shares, token.totalShares) / 1e9;
  const positionValueUsd = positionValueSol * solPriceUsd;

  // Original investment
  const investedSol = (position.invested ?? position.solBasis) / 1e9;
  const investedUsd = position.investedUsd ?? investedSol * solPriceUsd;

  // Unrealized gains
  const unrealizedGainSol =
    position.unrealizedGain ?? positionValueSol - investedSol;
  const unrealizedGainUsd =
    position.unrealizedGainUsd ?? unrealizedGainSol * solPriceUsd;

  // ROI
  const roiPercent =
    position.roiPercent ??
    (investedSol > 0 ? (unrealizedGainSol / investedSol) * 100 : 0);

  // Ownership percentage
  const ownershipPercent =
    position.ownershipPercent ??
    getOwnershipPercent(position.shares, token.totalShares);

  // Graduation estimates
  const estimatedTokensAtGraduation = estimateTokensAtGraduation(
    position.shares,
    token.totalShares // Estimate based on current supply (will be higher at graduation)
  );

  // Conservative estimate: graduation may have 2-3x more shares
  const estimatedTokensConservative = estimateTokensAtGraduation(
    position.shares,
    token.totalShares * 2.5
  );

  const isProfitable = unrealizedGainSol >= 0;
  const graduationProgress = (token.marketCapUsd / GRADUATION_MARKET_CAP_USD) * 100;

  return (
    <TooltipProvider>
      <Card
        className={`bg-slate-950 border-slate-800 overflow-hidden ${className}`}
      >
        {/* Cyberpunk gradient accent */}
        <div className="h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500" />

        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-cyan-400" />
              Your Position
            </CardTitle>
            <Badge
              variant={isProfitable ? "default" : "destructive"}
              className={`${
                isProfitable
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-400 border-rose-500/30"
              }`}
            >
              {isProfitable ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {roiPercent >= 0 ? "+" : ""}
              {roiPercent.toFixed(1)}% ROI
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Shares Owned */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Shares Owned</span>
            <span className="text-slate-100 font-mono font-semibold">
              {position.shares.toLocaleString()}
            </span>
          </div>

          {/* Position Value */}
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-sm flex items-center gap-1">
                Position Value
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-slate-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-xs">
                    <p>
                      Current market value if you sold your position now. Based
                      on current bonding curve price.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </span>
              <span
                className={`font-mono font-bold text-lg ${
                  isProfitable ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                ${positionValueUsd.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="text-slate-500 text-xs font-mono">
              {positionValueSol.toFixed(4)} SOL
            </div>
          </div>

          {/* Invested Amount */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Invested</span>
            <div className="text-right">
              <div className="text-slate-200 font-mono">
                ${investedUsd.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="text-slate-500 text-xs font-mono">
                {investedSol.toFixed(4)} SOL
              </div>
            </div>
          </div>

          <Separator className="bg-slate-800" />

          {/* Unrealized Gains */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm flex items-center gap-1">
              <Target className="w-4 h-4 text-purple-400" />
              Unrealized Gains
            </span>
            <div className="text-right">
              <div
                className={`font-mono font-semibold ${
                  isProfitable ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {isProfitable ? "+" : ""}
                ${Math.abs(unrealizedGainUsd).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="text-slate-500 text-xs font-mono">
                {isProfitable ? "+" : ""}
                {unrealizedGainSol.toFixed(4)} SOL
              </div>
            </div>
          </div>

          {/* Ownership Percentage */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm flex items-center gap-1">
              <Percent className="w-4 h-4 text-amber-400" />
              Ownership
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-100 font-mono">
                {ownershipPercent.toFixed(4)}%
              </span>
              {ownershipPercent > 10 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Zap className="w-4 h-4 text-amber-400" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
                    <p>Major holder! Your position exceeds 10% of supply.</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          <Separator className="bg-slate-800" />

          {/* Estimated Tokens at Graduation */}
          <div className="bg-gradient-to-r from-purple-900/20 to-cyan-900/20 rounded-lg p-3 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-medium">
                Estimated at Graduation
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-slate-400 text-xs mb-1">Token Amount</div>
                <div className="text-cyan-400 font-mono font-semibold">
                  {estimatedTokensConservative.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                  <span className="text-slate-500 text-xs ml-1">
                    -{" "}
                    {estimatedTokensAtGraduation.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-xs mb-1">
                  Est. Value @ $0.00005/token
                </div>
                <div className="text-emerald-400 font-mono font-semibold">
                  $
                  {(estimatedTokensConservative * 0.00005).toLocaleString(
                    undefined,
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                  )}
                  <span className="text-slate-500 text-xs ml-1">
                    -{" "}
                    {(estimatedTokensAtGraduation * 0.00005).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-slate-500 text-xs mt-2 italic">
              *Actual amount depends on final share count at graduation
            </div>
          </div>

          {/* Graduation Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-4 h-4 text-cyan-400" />
                Graduation Progress
              </span>
              <span className="text-cyan-400 font-mono">
                {graduationProgress.toFixed(1)}%
              </span>
            </div>
            <div className="relative">
              <Progress
                value={Math.min(graduationProgress, 100)}
                className="h-2 bg-slate-800"
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white/50"
                style={{ left: "${graduationProgress}%" }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>
                ${token.marketCapUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} /{" "}
                ${GRADUATION_MARKET_CAP_USD.toLocaleString()}
              </span>
              <span>
                {graduationProgress >= 100
                  ? "Ready to graduate!"
                  : `$${(GRADUATION_MARKET_CAP_USD - token.marketCapUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })} more needed`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
