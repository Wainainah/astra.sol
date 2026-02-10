"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TransactionModal,
  useTransactionModal,
} from "@/components/ui/TransactionModal";
import { GraduationCap, Clock, AlertTriangle } from "lucide-react";
import { useGraduationGates } from "@/hooks/useGraduationGates";

interface GraduateButtonProps {
  tokenAddress: string;
  tokenName: string;
  ticker: string;
  isCreator: boolean;
  creatorExclusivityEndsAt?: Date;
  // V7: Use off-chain gate checking instead of pre-computed gatesPassed
  holders: number;
  lockedSol: number;
  ageHours: number;
}

export function GraduateButton({
  tokenAddress,
  tokenName,
  ticker,
  isCreator,
  creatorExclusivityEndsAt,
  holders,
  lockedSol,
  ageHours,
}: GraduateButtonProps) {
  const modal = useTransactionModal();
  const [countdown, setCountdown] = useState<string | null>(null);

  // V7: Check off-chain graduation gates (market cap, holders, concentration)
  const {
    gates,
    marketCapMet,
    holdersMet,
    concentrationMet,
    isLoading: gatesLoading,
  } = useGraduationGates(tokenAddress, {
    refreshInterval: 10000, // Refresh every 10 seconds
    autoRefresh: true,
  });

  // All gates must pass for graduation
  const gatesPassed = gates?.canGraduate ?? false;

  // Check if we're in creator exclusivity period
  const now = new Date();
  const inExclusivityPeriod =
    creatorExclusivityEndsAt && now < creatorExclusivityEndsAt;

  // Calculate countdown for non-creators during exclusivity
  useEffect(() => {
    if (inExclusivityPeriod && !isCreator && creatorExclusivityEndsAt) {
      const updateCountdown = () => {
        const diff = creatorExclusivityEndsAt.getTime() - Date.now();
        if (diff <= 0) {
          setCountdown(null);
          return;
        }
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setCountdown(`${hours}h ${minutes}m`);
      };
      updateCountdown();
      const interval = setInterval(updateCountdown, 60000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [inExclusivityPeriod, isCreator, creatorExclusivityEndsAt]);

  const handleGraduate = async () => {
    modal.startPending();

    // Simulate transaction - in real implementation, call contract
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate success
    modal.setSuccess("grad123...abc");
  };

  // V7: Build gate status summary for the tooltip/modal
  const getGateStatusMessage = () => {
    if (gatesLoading) return "Checking graduation requirements...";
    if (!gates) return "Unable to check graduation gates";

    const failures: string[] = [];
    if (!marketCapMet) failures.push("market cap");
    if (!holdersMet) failures.push("holders");
    if (!concentrationMet) failures.push("concentration");

    if (failures.length === 0) return "All graduation gates passed!";
    return `Missing: ${failures.join(", ")}`;
  };

  // V7: Check which specific gates are blocking
  const getBlockingReasons = () => {
    if (!gates || gates.canGraduate) return [];
    return gates.blockingReasons;
  };

  // Loading state while checking gates
  if (gatesLoading) {
    return (
      <Button disabled className="w-full">
        <GraduationCap className="h-4 w-4 mr-2 animate-pulse" />
        Checking Gates...
      </Button>
    );
  }

  // Gates not met - show disabled button with tooltip explaining why
  if (!gatesPassed) {
    const blockingReasons = getBlockingReasons();

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button disabled className="w-full">
              <GraduationCap className="h-4 w-4 mr-2" />
              Gates Not Met
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Graduation Requirements
              </p>
              <ul className="text-sm space-y-1">
                <li className={marketCapMet ? "text-green-400" : "text-red-400"}>
                  {marketCapMet ? "✓" : "✗"} Market Cap: ${gates?.marketCapUsd.toLocaleString()} / $42,000
                </li>
                <li className={holdersMet ? "text-green-400" : "text-red-400"}>
                  {holdersMet ? "✓" : "✗"} Holders: {gates?.holders} / 100
                </li>
                <li className={concentrationMet ? "text-green-400" : "text-red-400"}>
                  {concentrationMet ? "✓" : "✗"} Top Holder: {(gates?.concentration ?? 0 / 100).toFixed(1)}% / 10%
                </li>
              </ul>
              {blockingReasons.length > 0 && (
                <div className="text-xs text-muted-foreground pt-1 border-t border-border">
                  {blockingReasons.map((reason, idx) => (
                    <p key={idx}>{reason}</p>
                  ))}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Creator exclusivity period - non-creators must wait
  if (inExclusivityPeriod && !isCreator) {
    return (
      <div className="space-y-2">
        <Button disabled className="w-full">
          <Clock className="h-4 w-4 mr-2" />
          Creator Exclusivity
        </Button>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">{countdown}</Badge>
          <span>until anyone can graduate</span>
        </div>
      </div>
    );
  }

  // All gates passed - ready to graduate
  return (
    <>
      <Button onClick={modal.startConfirm} className="w-full">
        <GraduationCap className="h-4 w-4 mr-2" />
        {isCreator ? "Graduate Your Token" : "Graduate Token"}
      </Button>

      <TransactionModal
        open={modal.open}
        onOpenChange={modal.setOpen}
        state={modal.state}
        title="Graduate Token"
        description={`Launch ${tokenName} ($${ticker}) on Raydium`}
        summary={[
          { label: "Holders", value: holders.toString() },
          { label: "Locked SOL", value: `${lockedSol.toFixed(2)} SOL` },
          { label: "Age", value: `${ageHours}h` },
          { label: "Market Cap", value: `$${gates?.marketCapUsd.toLocaleString() ?? "..."}` },
          { label: "Top Holder", value: `${((gates?.concentration ?? 0) / 100).toFixed(1)}%` },
        ]}
        actions={[
          `Deploy $${ticker} token`,
          "Add liquidity to Raydium",
          "Enable token claims for all holders",
        ]}
        signature={modal.signature}
        errorMessage={modal.error}
        onConfirm={handleGraduate}
        onRetry={handleGraduate}
        successTitle="Graduated Successfully!"
        successDescription={`$${ticker} is now live on Raydium!`}
        successActions={[
          {
            label: "View Token",
            onClick: () => {
              window.open(
                `https://explorer.solana.com/address/${tokenAddress}?cluster=devnet`,
                "_blank",
              );
            },
          },
          {
            label: "Claim Your Tokens",
            onClick: () => {
              modal.close();
              // Navigate to profile or claim page
            },
          },
        ]}
      />
    </>
  );
}
