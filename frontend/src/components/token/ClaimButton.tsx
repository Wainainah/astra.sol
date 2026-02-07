"use client";

import { Button } from "@/components/ui/button";
import {
  TransactionModal,
  useTransactionModal,
} from "@/components/ui/TransactionModal";
import { Gift } from "lucide-react";
import { useClaim } from "@/hooks/useClaim";

interface ClaimButtonProps {
  tokenAddress: string;
  tokenMint?: string;
  tokenName: string;
  ticker: string;
  sharesAmount: number;
  tokensToReceive: number;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

/**
 * ClaimButton Component (V7)
 * 
 * Allows users to claim their proportional share of tokens after graduation.
 * 
 * V7 PROPORTIONAL DISTRIBUTION:
 * - tokensToReceive is calculated as: (shares / totalSharesAtGraduation) * 800,000,000
 * - This represents the user's proportional share of the 800M tokens allocated to holders
 * - Only unlocked shares (regular shares field) count toward the claim
 * - lockedShares is for creator vesting only
 * 
 * @example
 * ```tsx
 * <ClaimButton
 *   tokenAddress="..."
 *   tokenMint="..."
 *   tokenName="My Token"
 *   ticker="MTK"
 *   sharesAmount={1000000}
 *   tokensToReceive={500000} // Calculated proportionally
 * />
 * ```
 */
export function ClaimButton({
  tokenAddress,
  tokenMint,
  tokenName,
  ticker,
  sharesAmount,
  tokensToReceive,
  variant = "default",
  size = "default",
  className,
}: ClaimButtonProps) {
  const modal = useTransactionModal();

  const { claim, isPending } = useClaim({
    launchAddress: tokenAddress,
    tokenMint: tokenMint,
  });

  const handleClaim = async () => {
    modal.startPending();
    try {
      await claim();
      modal.setSuccess();
    } catch (error) {
      modal.setFailed(error instanceof Error ? error.message : "Claim failed");
    }
  };

  return (
    <>
      <Button
        onClick={modal.startConfirm}
        variant={variant}
        size={size}
        className={className}
        disabled={isPending}
      >
        <Gift className="h-4 w-4 mr-2" />
        Claim ${ticker}
      </Button>

      <TransactionModal
        open={modal.open}
        onOpenChange={modal.setOpen}
        state={modal.state}
        title={`Claim $${ticker} Tokens`}
        description={`Claim your proportional share of tokens from ${tokenName}`}
        summary={[
          { label: "Your shares", value: sharesAmount.toLocaleString() },
          {
            label: "Tokens to receive",
            value: `${tokensToReceive.toLocaleString()} $${ticker}`,
          },
        ]}
        actions={[
          `Burn ${sharesAmount.toLocaleString()} shares`,
          `Receive ${tokensToReceive.toLocaleString()} $${ticker}`,
        ]}
        signature={modal.signature}
        errorMessage={modal.error}
        onConfirm={handleClaim}
        onRetry={handleClaim}
        successTitle="Tokens Claimed!"
        successDescription={`You received ${tokensToReceive.toLocaleString()} $${ticker}`}
        successActions={[
          {
            label: "View on Explorer",
            onClick: () => {
              window.open(
                `https://explorer.solana.com/address/${tokenAddress}?cluster=devnet`,
                "_blank",
              );
            },
          },
          {
            label: "Done",
            onClick: modal.close,
          },
        ]}
      />
    </>
  );
}
