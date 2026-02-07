"use client";

import { Button } from "@/components/ui/button";
import {
  TransactionModal,
  useTransactionModal,
} from "@/components/ui/TransactionModal";
import { RefreshCw } from "lucide-react";
import { useRefund } from "@/hooks/useRefund";

interface RefundButtonProps {
  tokenAddress: string;
  tokenName: string;
  basisAmount: number;
  refundAmount: number;
  protocolFee: number;
  variant?: "default" | "outline" | "destructive";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function RefundButton({
  tokenAddress,
  tokenName,
  basisAmount,
  refundAmount,
  protocolFee,
  variant = "destructive",
  size = "default",
  className,
}: RefundButtonProps) {
  const modal = useTransactionModal();

  const { refund, isPending } = useRefund({
    launchAddress: tokenAddress,
  });

  const handleRefund = async () => {
    modal.startPending();
    try {
      await refund();
      modal.setSuccess();
    } catch (error) {
      modal.setFailed(error instanceof Error ? error.message : "Refund failed");
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
        <RefreshCw className="h-4 w-4 mr-2" />
        Claim Refund
      </Button>

      <TransactionModal
        open={modal.open}
        onOpenChange={modal.setOpen}
        state={modal.state}
        title="Claim Refund"
        description={`Get your SOL back from ${tokenName}`}
        summary={[
          { label: "Your basis", value: `${basisAmount.toFixed(4)} SOL` },
          {
            label: "Protocol fee (0.5%)",
            value: `${protocolFee.toFixed(4)} SOL`,
          },
          { label: "Refund amount", value: `${refundAmount.toFixed(4)} SOL` },
        ]}
        actions={[
          "Burn your position",
          `Receive ${refundAmount.toFixed(4)} SOL`,
        ]}
        signature={modal.signature}
        errorMessage={modal.error}
        onConfirm={handleRefund}
        onRetry={handleRefund}
        successTitle="Refund Claimed!"
        successDescription={`You received ${refundAmount.toFixed(4)} SOL`}
        successActions={[
          {
            label: "View Transaction",
            onClick: () => {
              window.open(
                `https://explorer.solana.com/tx/${modal.signature}?cluster=devnet`,
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
