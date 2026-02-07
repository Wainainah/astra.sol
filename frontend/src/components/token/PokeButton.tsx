"use client";

import { Button } from "@/components/ui/button";
import {
    TransactionModal,
    useTransactionModal,
} from "@/components/ui/TransactionModal";
import { Egg } from "lucide-react";

interface PokeButtonProps {
    vaultAddress: string;
    tokenName: string;
    ticker: string;
    pendingRewards: number;
    variant?: "default" | "outline";
    size?: "default" | "sm" | "lg";
    className?: string;
}

// Calculate poker reward (1% of pending)
function calculatePokerReward(pendingRewards: number): number {
    return pendingRewards * 0.01;
}

export function PokeButton({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    vaultAddress: _vaultAddress,
    tokenName,
    ticker,
    pendingRewards,
    variant = "default",
    size = "default",
    className,
}: PokeButtonProps) {
    const modal = useTransactionModal();
    const pokerReward = calculatePokerReward(pendingRewards);

    const handlePoke = async () => {
        modal.startPending();

        // Simulate transaction - in real implementation, call contract
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Simulate success
        modal.setSuccess("poke...xyz");
    };

    const isDisabled = pendingRewards < 1; // Don't poke for tiny amounts

    return (
        <>
            <Button
                onClick={modal.startConfirm}
                variant={variant}
                size={size}
                className={`w-full ${className}`}
                disabled={isDisabled}
            >
                <Egg className="h-4 w-4 mr-2" />
                {isDisabled
                    ? "Not enough pending rewards"
                    : `🍳 Poke Vault (earn ${pokerReward.toFixed(2)} SOL)`}
            </Button>

            <TransactionModal
                open={modal.open}
                onOpenChange={modal.setOpen}
                state={modal.state}
                title={`Poke ${tokenName} Vault`}
                description={`Harvest pending rewards for $${ticker}`}
                summary={[
                    { label: "Pending rewards", value: `${pendingRewards.toFixed(2)} SOL` },
                    { label: "Your reward (1%)", value: `${pokerReward.toFixed(2)} SOL` },
                    { label: "To creator (60%)", value: `${(pendingRewards * 0.6).toFixed(2)} SOL` },
                ]}
                actions={[
                    "Harvest rewards from protocol",
                    "Distribute to creator, protocol, and LP",
                    `Receive ${pokerReward.toFixed(2)} SOL as poker reward`,
                ]}
                signature={modal.signature}
                errorMessage={modal.error}
                onConfirm={handlePoke}
                onRetry={handlePoke}
                successTitle="Poked Successfully!"
                successDescription={`You earned ${pokerReward.toFixed(2)} SOL for poking the vault!`}
                successActions={[
                    {
                        label: "View Transaction",
                        onClick: () => {
                            window.open(
                                `https://explorer.solana.com/tx/${modal.signature}?cluster=devnet`,
                                "_blank"
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
