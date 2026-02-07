"use client";

import { Share2, Copy, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  tokenAddress: string;
  tokenName: string;
  ticker?: string;
  status?: string;
  holders?: number;
  variant?: "icon" | "button";
  className?: string;
}

function getShareUrl(tokenAddress: string): string {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://astra.finance";
  return `${baseUrl}/token/${tokenAddress}`;
}

function getTwitterShareUrl(
  tokenName: string,
  ticker: string | undefined,
  status: string | undefined,
  holders: number | undefined,
  url: string
): string {
  const tickerPart = ticker ? ` ($${ticker})` : "";
  const statusPart = status ? `\n\n${status}` : "";
  const holdersPart = holders ? ` | ${holders} holders` : "";

  const text = `Check out ${tokenName}${tickerPart} on @AstraProtocol${statusPart}${holdersPart}\n\n${url}`;

  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

function getTelegramShareUrl(tokenName: string, url: string): string {
  const text = `Check out ${tokenName} on Astra Protocol`;
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function ShareButton({
  tokenAddress,
  tokenName,
  ticker,
  status,
  holders,
  variant = "icon",
  className,
}: ShareButtonProps) {
  const shareUrl = getShareUrl(tokenAddress);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  }

  async function handleNativeShare() {
    if (!navigator.share) {
      handleCopyLink();
      return;
    }

    try {
      await navigator.share({
        title: `${tokenName} on Astra Protocol`,
        text: `Check out ${tokenName}${ticker ? ` ($${ticker})` : ""} on Astra Protocol`,
        url: shareUrl,
      });
    } catch (err) {
      // User cancelled or share failed - don't show error for user cancellation
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error("Failed to share");
      }
    }
  }

  function handleTwitterShare() {
    const twitterUrl = getTwitterShareUrl(
      tokenName,
      ticker,
      status,
      holders,
      shareUrl
    );
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
  }

  function handleTelegramShare() {
    const telegramUrl = getTelegramShareUrl(tokenName, shareUrl);
    window.open(telegramUrl, "_blank", "noopener,noreferrer");
  }

  const triggerButton =
    variant === "icon" ? (
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", className)}
        aria-label="Share token"
      >
        <Share2 className="h-4 w-4" />
      </Button>
    ) : (
      <Button variant="outline" size="sm" className={className}>
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </Button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopyLink}>
          <Link2 className="mr-2 h-4 w-4" />
          Copy link
        </DropdownMenuItem>
        {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
          <DropdownMenuItem onClick={handleNativeShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share...
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleTwitterShare}>
          <svg
            className="mr-2 h-4 w-4"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Share on X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTelegramShare}>
          <svg
            className="mr-2 h-4 w-4"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
          Share on Telegram
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
