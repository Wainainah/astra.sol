"use client";

import { useSolPrice } from "@/hooks/useSolPrice";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  /** SOL amount to display */
  sol: number;
  /** Show USD conversion (default true) */
  showUsd?: boolean;
  /** Number of decimal places for SOL (default 4) */
  solDecimals?: number;
  /** Number of decimal places for USD (default 2) */
  usdDecimals?: number;
  /** Class name for the container */
  className?: string;
  /** Class name for the SOL amount */
  solClassName?: string;
  /** Class name for the USD amount */
  usdClassName?: string;
  /** Layout direction */
  direction?: "row" | "column";
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * Display SOL amount with optional USD conversion
 *
 * Usage:
 * <PriceDisplay sol={1.5} />
 * => "1.5000 SOL (~$225.00)"
 */
export function PriceDisplay({
  sol,
  showUsd = true,
  solDecimals = 4,
  usdDecimals = 2,
  className,
  solClassName,
  usdClassName,
  direction = "row",
  size = "md",
}: PriceDisplayProps) {
  const { price: solPrice } = useSolPrice();
  const usdValue = sol * solPrice;

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const formatSol = (amount: number): string => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    if (amount >= 1) {
      return amount.toFixed(Math.min(solDecimals, 2));
    }
    return amount.toFixed(solDecimals);
  };

  const formatUsd = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(usdDecimals)}`;
  };

  return (
    <span
      className={cn(
        "font-mono",
        direction === "row" ? "inline-flex items-baseline gap-1" : "flex flex-col",
        sizeClasses[size],
        className
      )}
    >
      <span className={cn("font-semibold", solClassName)}>
        {formatSol(sol)} SOL
      </span>
      {showUsd && (
        <span
          className={cn(
            "text-muted-foreground",
            direction === "row" && "text-[0.85em]",
            usdClassName
          )}
        >
          ({formatUsd(usdValue)})
        </span>
      )}
    </span>
  );
}

/**
 * Display just USD value (useful for market cap, volume)
 */
export function UsdDisplay({
  usd,
  className,
  decimals = 0,
  compact = true,
}: {
  usd: number;
  className?: string;
  decimals?: number;
  compact?: boolean;
}) {
  const format = (amount: number): string => {
    if (compact) {
      if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}M`;
      }
      if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(1)}K`;
      }
    }
    return `$${amount.toFixed(decimals)}`;
  };

  return <span className={cn("font-mono", className)}>{format(usd)}</span>;
}

/**
 * Display SOL with market cap in USD
 * Used for bonding curve progress displays
 */
export function MarketCapDisplay({
  lockedSol,
  className,
  showProgress = false,
  targetSol = 105,
}: {
  lockedSol: number;
  className?: string;
  showProgress?: boolean;
  targetSol?: number;
}) {
  const { price: solPrice } = useSolPrice();
  const marketCapUsd = lockedSol * solPrice;
  const targetUsd = targetSol * solPrice;
  const progress = (lockedSol / targetSol) * 100;

  return (
    <div className={cn("font-mono", className)}>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold">
          {lockedSol.toFixed(2)} SOL
        </span>
        <span className="text-sm text-muted-foreground">
          (${marketCapUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })})
        </span>
      </div>
      {showProgress && (
        <div className="text-xs text-muted-foreground mt-1">
          {progress.toFixed(1)}% to ${targetUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} graduation
        </div>
      )}
    </div>
  );
}
