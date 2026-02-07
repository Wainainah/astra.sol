"use client";

import { ReactNode } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  Wallet,
  Coins,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";

interface PreflightChecksProps {
  children: ReactNode;
  factoryConfigured: boolean;
  minBalance?: number; // Minimum balance in SOL (default: 0.05 SOL for seed + gas)
}

const DEFAULT_MIN_BALANCE = 0.05; // 0.05 SOL

export function PreflightChecks({
  children,
  factoryConfigured,
  minBalance = DEFAULT_MIN_BALANCE,
}: PreflightChecksProps) {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    if (publicKey && connected) {
      setBalanceLoading(true);
      connection
        .getBalance(publicKey)
        .then((bal) => setBalance(bal / LAMPORTS_PER_SOL))
        .catch(() => setBalance(0))
        .finally(() => setBalanceLoading(false));
    }
  }, [publicKey, connected, connection]);

  // Check 1: Factory configured
  if (!factoryConfigured) {
    return (
      <PreflightCard>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Service Unavailable</AlertTitle>
          <AlertDescription>
            The token factory is not configured. Please try again later or
            contact support.
          </AlertDescription>
        </Alert>
      </PreflightCard>
    );
  }

  // Check 2: Wallet connected
  if (!connected) {
    return (
      <PreflightCard>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Connect Your Wallet</h3>
              <p className="text-sm text-muted-foreground">
                You need to connect a wallet to create a token.
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <WalletMultiButton />
          </div>
        </div>
      </PreflightCard>
    );
  }

  // Check 3: Sufficient balance
  if (balanceLoading) {
    return (
      <PreflightCard>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">
            Checking balance...
          </span>
        </div>
      </PreflightCard>
    );
  }

  const currentBalance = balance ?? 0;
  if (currentBalance < minBalance) {
    return (
      <PreflightCard>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-orange-500/10">
              <Coins className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold">Insufficient Balance</h3>
              <p className="text-sm text-muted-foreground">
                You need at least {minBalance} SOL to create a token (seed +
                gas).
              </p>
            </div>
          </div>

          <Alert variant="default" className="bg-muted/50">
            <AlertDescription className="flex justify-between items-center">
              <span>Your balance:</span>
              <span className="font-mono font-medium">
                {currentBalance.toFixed(4)} SOL
              </span>
            </AlertDescription>
          </Alert>

          <Button variant="outline" className="w-full" size="lg" asChild>
            <a
              href="https://faucet.solana.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Coins className="h-4 w-4 mr-2" />
              Get Devnet SOL from Faucet →
            </a>
          </Button>
        </div>
      </PreflightCard>
    );
  }

  // All checks passed - show success indicator briefly, then children
  return (
    <div className="space-y-4">
      <PreflightStatus
        balance={currentBalance.toFixed(4)}
        address={publicKey!.toBase58()}
      />
      {children}
    </div>
  );
}

function PreflightCard({ children }: { children: ReactNode }) {
  return (
    <Card className="border-dashed">
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}

function PreflightStatus({
  balance,
  address,
}: {
  balance: string;
  address: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span className="text-sm text-green-600">Ready to create</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="font-mono">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <span className="font-mono">{balance} SOL</span>
      </div>
    </div>
  );
}
