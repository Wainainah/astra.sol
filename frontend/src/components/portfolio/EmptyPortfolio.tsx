"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, PackageOpen, Rocket, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyPortfolioProps {
  className?: string;
  variant?: "default" | "compact";
}

/**
 * V7 Empty Portfolio State
 *
 * Displayed when user has no positions.
 * Encourages exploration and token creation.
 */
export function EmptyPortfolio({
  className,
  variant = "default",
}: EmptyPortfolioProps) {
  if (variant === "compact") {
    return (
      <Card className={cn("border border-dashed", className)}>
        <CardContent className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
            <PackageOpen className="h-6 w-6 text-muted-foreground" />
          </div>

          <h3 className="text-lg font-mono font-semibold mb-1">
            No positions yet
          </h3>

          <p className="text-sm text-muted-foreground font-mono mb-4">
            Start investing to build your portfolio
          </p>

          <Link href="/">
            <Button variant="outline" size="sm" className="font-mono">
              <TrendingUp className="h-4 w-4 mr-2" />
              Explore Tokens
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border bg-card/50", className)}>
      <CardContent className="flex flex-col items-center justify-center py-16 px-4">
        {/* Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
            <Wallet className="h-12 w-12 text-primary" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center ring-1 ring-secondary/30">
            <Sparkles className="h-4 w-4 text-secondary" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-mono font-bold mb-2">PORTFOLIO_EMPTY</h2>

        {/* Description */}
        <p className="text-muted-foreground font-mono text-center max-w-md mb-8">
          Your portfolio is ready and waiting. Start by creating your own token
          or investing in existing launches to see your holdings and track
          performance here.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/create">
            <Button size="lg" className="font-mono gap-2">
              <Rocket className="h-4 w-4" />
              Launch Token
            </Button>
          </Link>

          <Link href="/">
            <Button variant="outline" size="lg" className="font-mono gap-2">
              <TrendingUp className="h-4 w-4" />
              Explore Tokens
            </Button>
          </Link>
        </div>

        {/* Stats Preview */}
        <div className="mt-12 grid grid-cols-3 gap-8 text-center">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-2xl font-mono font-bold text-muted-foreground">0</p>
            <p className="text-xs text-muted-foreground font-mono uppercase mt-1">
              Positions
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-2xl font-mono font-bold text-muted-foreground">
              0%
            </p>
            <p className="text-xs text-muted-foreground font-mono uppercase mt-1">
              Returns
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-2xl font-mono font-bold text-muted-foreground">0</p>
            <p className="text-xs text-muted-foreground font-mono uppercase mt-1">
              Trades
            </p>
          </div>
        </div>

        {/* Hint */}
        <p className="mt-8 text-xs text-muted-foreground font-mono text-center max-w-sm">
          Tip: Graduated tokens can be claimed for SPL tokens. Keep an eye on
          the graduation progress!
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Empty Portfolio with Custom Message
 */
export function EmptyPortfolioMessage({
  title = "No positions yet",
  description = "Start investing to build your portfolio",
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <PackageOpen className="h-8 w-8 text-muted-foreground" />
      </div>

      <h3 className="text-lg font-mono font-semibold mb-1">{title}</h3>

      <p className="text-sm text-muted-foreground font-mono mb-4 max-w-sm">
        {description}
      </p>

      {action}
    </div>
  );
}
