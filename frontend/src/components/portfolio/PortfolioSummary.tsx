"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Package,
  GraduationCap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Portfolio Summary Data Interface
 */
export interface PortfolioSummaryData {
  totalValueSol: number;
  totalValueUsd: number;
  totalInvestedSol: number;
  totalInvestedUsd: number;
  totalUnrealizedPnlSol: number;
  totalUnrealizedPnlUsd: number;
  totalUnrealizedPnlPercent: number;
  totalPositions: number;
  graduatedPositions: number;
  activePositions: number;
}

interface PortfolioSummaryProps {
  summary: PortfolioSummaryData;
  solPriceUsd?: number;
  className?: string;
}

/**
 * Format number with specified decimals
 */
function formatNumber(num: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format large numbers with K/M/B suffix
 */
function formatCompact(num: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}

/**
 * Summary Card Component
 */
function SummaryCard({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
  trendValue,
  variant = "default",
  className,
}: {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "success" | "danger" | "warning" | "info";
  className?: string;
}) {
  const variantStyles = {
    default: "bg-card",
    success: "bg-emerald-500/5 border-emerald-500/20",
    danger: "bg-red-500/5 border-red-500/20",
    warning: "bg-amber-500/5 border-amber-500/20",
    info: "bg-blue-500/5 border-blue-500/20",
  };

  const iconStyles = {
    default: "bg-muted",
    success: "bg-emerald-500/20 text-emerald-400",
    danger: "bg-red-500/20 text-red-400",
    warning: "bg-amber-500/20 text-amber-400",
    info: "bg-blue-500/20 text-blue-400",
  };

  return (
    <Card className={cn("border", variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-mono text-muted-foreground uppercase">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg", iconStyles[variant])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-mono font-bold">{value}</div>
        {subValue && (
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {subValue}
          </p>
        )}
        {trend && trendValue && (
          <div className="flex items-center gap-1 mt-2">
            {trend === "up" ? (
              <ArrowUpRight className="h-3 w-3 text-emerald-400" />
            ) : trend === "down" ? (
              <ArrowDownRight className="h-3 w-3 text-red-400" />
            ) : null}
            <span
              className={cn(
                "text-xs font-mono",
                trend === "up"
                  ? "text-emerald-400"
                  : trend === "down"
                  ? "text-red-400"
                  : "text-muted-foreground"
              )}
            >
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * V7 Portfolio Summary
 *
 * Top-level summary cards showing:
 * - Total portfolio value (sum of all position values on curve)
 * - Total invested (sum of all basis)
 * - Total unrealized P&L ("paper gains" that realize at graduation)
 * - Number of positions and graduation count
 */
export function PortfolioSummary({
  summary,
  solPriceUsd = 0,
  className,
}: PortfolioSummaryProps) {
  const isProfitable = summary.totalUnrealizedPnlSol >= 0;

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {/* Total Portfolio Value */}
      <SummaryCard
        title="Total Value"
        value={`${formatNumber(summary.totalValueSol, 4)} SOL`}
        subValue={solPriceUsd > 0 ? `$${formatNumber(summary.totalValueUsd)}` : undefined}
        icon={Wallet}
        variant="info"
      />

      {/* Total Invested */}
      <SummaryCard
        title="Total Invested"
        value={`${formatNumber(summary.totalInvestedSol, 4)} SOL`}
        subValue={solPriceUsd > 0 ? `$${formatNumber(summary.totalInvestedUsd)}` : undefined}
        icon={Package}
        variant="default"
      />

      {/* Unrealized P&L - Paper Gains */}
      <SummaryCard
        title="Unrealized P&L"
        value={`${isProfitable ? "+" : ""}${formatNumber(
          summary.totalUnrealizedPnlSol,
          4
        )} SOL`}
        subValue={
          solPriceUsd > 0
            ? `${isProfitable ? "+" : ""}$${formatNumber(
                summary.totalUnrealizedPnlUsd
              )}`
            : undefined
        }
        icon={isProfitable ? TrendingUp : TrendingDown}
        trend={isProfitable ? "up" : "down"}
        trendValue={`${isProfitable ? "+" : ""}${summary.totalUnrealizedPnlPercent.toFixed(
          2
        )}%`}
        variant={isProfitable ? "success" : "danger"}
      />

      {/* Positions & Graduation */}
      <Card className="border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground uppercase">
            Positions
          </CardTitle>
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
            <Target className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-mono font-bold">
                {summary.totalPositions}
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {summary.activePositions} active
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-emerald-400">
                <GraduationCap className="h-4 w-4" />
                <span className="text-lg font-mono font-bold">
                  {summary.graduatedPositions}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                graduated
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Compact Portfolio Summary (for mobile/sidebar)
 */
export function PortfolioSummaryCompact({
  summary,
  solPriceUsd = 0,
  className,
}: PortfolioSummaryProps) {
  const isProfitable = summary.totalUnrealizedPnlSol >= 0;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Total Value */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-mono uppercase">
              Total Value
            </p>
            <p className="font-mono font-semibold">
              {formatNumber(summary.totalValueSol, 4)} SOL
            </p>
          </div>
        </div>
        {solPriceUsd > 0 && (
          <p className="text-sm text-muted-foreground font-mono">
            ${formatNumber(summary.totalValueUsd)}
          </p>
        )}
      </div>

      {/* P&L */}
      <div
        className={cn(
          "flex items-center justify-between p-3 rounded-lg border",
          isProfitable
            ? "bg-emerald-500/5 border-emerald-500/20"
            : "bg-red-500/5 border-red-500/20"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-lg",
              isProfitable
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            )}
          >
            {isProfitable ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-mono uppercase">
              Unrealized P&L
            </p>
            <p
              className={cn(
                "font-mono font-semibold",
                isProfitable ? "text-emerald-400" : "text-red-400"
              )}
            >
              {isProfitable ? "+" : ""}
              {formatNumber(summary.totalUnrealizedPnlSol, 4)} SOL
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className={cn(
              "text-sm font-mono",
              isProfitable ? "text-emerald-400" : "text-red-400"
            )}
          >
            {isProfitable ? "+" : ""}
            {summary.totalUnrealizedPnlPercent.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-lg bg-muted text-center">
          <p className="text-lg font-mono font-bold">{summary.totalPositions}</p>
          <p className="text-xs text-muted-foreground font-mono uppercase">
            Positions
          </p>
        </div>
        <div className="p-2 rounded-lg bg-muted text-center">
          <p className="text-lg font-mono font-bold text-emerald-400">
            {summary.graduatedPositions}
          </p>
          <p className="text-xs text-muted-foreground font-mono uppercase">
            Graduated
          </p>
        </div>
        <div className="p-2 rounded-lg bg-muted text-center">
          <p className="text-lg font-mono font-bold text-amber-400">
            {summary.activePositions}
          </p>
          <p className="text-xs text-muted-foreground font-mono uppercase">
            Active
          </p>
        </div>
      </div>
    </div>
  );
}
