"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, ArrowRight, Copy, Check, Loader2 } from "lucide-react";
import { useState } from "react";

interface CreateSuccessModalProps {
  open: boolean;
  onClose: () => void;
  tokenAddress: string;
  tokenName: string;
  tokenTicker: string;
  onViewToken: () => void;
}

export function CreateSuccessModal({
  open,
  onClose,
  tokenAddress,
  tokenName,
  tokenTicker,
  onViewToken,
}: CreateSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  const explorerUrl = `https://explorer.solana.com/address/${tokenAddress}?cluster=devnet`;
  const shortAddress = `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(tokenAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <DialogTitle className="text-2xl">Token Created!</DialogTitle>
          <DialogDescription>
            Your token is now live on the bonding curve.
          </DialogDescription>
        </DialogHeader>

        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="secondary" className="mb-2 font-mono">
                  ${tokenTicker}
                </Badge>
                <p className="font-semibold">{tokenName}</p>
              </div>
              <div className="text-4xl">🪙</div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Contract:</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background px-2 py-1 rounded">
                  {shortAddress}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleCopy}
                  aria-label={
                    copied ? "Copied to clipboard" : "Copy contract address"
                  }
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />
          <p className="text-sm text-yellow-600">
            It may take a few moments for your token to appear on the site.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="outline" className="w-full" asChild>
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Explorer
            </a>
          </Button>

          <Button className="w-full" onClick={onViewToken}>
            View Token
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
