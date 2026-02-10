"use client";

import { useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Copy,
  ExternalLink,
  Rocket,
  Twitter,
  Users,
  Target,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TokenCreatedModalProps {
  open: boolean;
  onClose: () => void;
  tokenAddress: string;
  tokenName: string;
  tokenTicker: string;
  signature: string;
}

export function TokenCreatedModal({
  open,
  onClose,
  tokenAddress,
  tokenName,
  tokenTicker,
  signature,
}: TokenCreatedModalProps) {
  const [copied, setCopied] = useState(false);

  // Fire confetti on open
  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#f97316", "#fb923c", "#fdba74"], // Orange theme
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#f97316", "#fb923c", "#fdba74"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f97316", "#fb923c", "#fdba74", "#ffffff"],
    });

    frame();
  }, []);

  useEffect(() => {
    if (open) {
      // Small delay for modal to render
      const timer = setTimeout(fireConfetti, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open, fireConfetti]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(tokenAddress);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    const text = `I just launched $${tokenTicker} on @AstraProtocol! 🚀

Check it out: https://astra.sol/token/${tokenAddress}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const explorerUrl = `https://explorer.solana.com/address/${tokenAddress}?cluster=devnet`;
  const txExplorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <Rocket className="h-8 w-8 text-green-500" />
          </div>
          <DialogTitle className="text-2xl">Token Launched!</DialogTitle>
          <DialogDescription>
            ${tokenTicker} is now live on Astra Protocol
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Token info */}
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-lg font-semibold">{tokenName}</p>
            <Badge variant="secondary" className="mt-1">
              ${tokenTicker}
            </Badge>
          </div>

          {/* Address with copy */}
          <div className="flex items-center gap-2 rounded-lg border p-3">
            <code className="flex-1 truncate text-sm text-muted-foreground">
              {tokenAddress}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Next steps */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Next steps to graduate:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
                <Target className="h-4 w-4 text-orange-500" />
                <span>Reach $42K market cap</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
                <Users className="h-4 w-4 text-orange-500" />
                <span>Get 100 holders</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span>24 hours minimum</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
                <Users className="h-4 w-4 text-orange-500" />
                <span>Top holder &lt;10%</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleShareTwitter} className="w-full gap-2">
              <Twitter className="h-4 w-4" />
              Share on X
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(explorerUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                Explorer
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(txExplorerUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                Transaction
              </Button>
            </div>
            <Button variant="ghost" onClick={onClose} className="w-full">
              View Token Page
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
