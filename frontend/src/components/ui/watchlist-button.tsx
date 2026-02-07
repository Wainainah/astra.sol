"use client";

import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useWatchlist } from "@/hooks/useWatchlist";
import { cn } from "@/lib/utils";

interface WatchlistButtonProps {
  tokenAddress: string;
  tokenName?: string;
  variant?: "icon" | "button";
  className?: string;
}

export function WatchlistButton({
  tokenAddress,
  tokenName,
  variant = "icon",
  className,
}: WatchlistButtonProps) {
  const { isWatched, toggleWatchlist, mounted, isFull } = useWatchlist();

  const watched = isWatched(tokenAddress);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!watched && isFull) {
      toast.error("Watchlist is full", {
        description: "Remove some tokens to add more (max 100)",
      });
      return;
    }

    const success = toggleWatchlist(tokenAddress);
    if (success) {
      if (watched) {
        toast.success("Removed from watchlist", {
          description: tokenName || tokenAddress.slice(0, 8) + "...",
        });
      } else {
        toast.success("Added to watchlist", {
          description: tokenName || tokenAddress.slice(0, 8) + "...",
        });
      }
    }
  }

  // Render placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return variant === "icon" ? (
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", className)}
        disabled
      >
        <Star className="h-4 w-4" />
        <span className="sr-only">Add to watchlist</span>
      </Button>
    ) : (
      <Button variant="outline" size="sm" className={className} disabled>
        <Star className="mr-2 h-4 w-4" />
        Watch
      </Button>
    );
  }

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", className)}
        onClick={handleClick}
        aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
      >
        <Star
          className={cn(
            "h-4 w-4 transition-colors",
            watched && "fill-primary text-primary"
          )}
        />
      </Button>
    );
  }

  return (
    <Button
      variant={watched ? "secondary" : "outline"}
      size="sm"
      className={className}
      onClick={handleClick}
    >
      <Star
        className={cn(
          "mr-2 h-4 w-4 transition-colors",
          watched && "fill-current"
        )}
      />
      {watched ? "Watching" : "Watch"}
    </Button>
  );
}
