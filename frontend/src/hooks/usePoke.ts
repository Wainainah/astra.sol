import { useState, useCallback } from "react";
import { toast } from "sonner";

/**
 * Hook to poke a vault and harvest pending rewards
 * 
 * Poking distributes pending rewards:
 * - 1% to the poker (caller)
 * - 60% to creator
 * - Remainder to protocol/LP
 */
export function usePoke({
    vaultAddress,
}: {
    vaultAddress: string | undefined;
}) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const poke = useCallback(async () => {
        if (!vaultAddress) {
            const err = new Error("Vault address required");
            setError(err);
            throw err;
        }

        setIsPending(true);
        setError(null);

        try {
            // TODO: Implement actual contract call
            // const tx = await program.methods.poke().accounts({
            //     vault: vaultAddress,
            //     poker: wallet.publicKey,
            //     ...
            // }).rpc();

            // Simulate for now
            await new Promise((resolve) => setTimeout(resolve, 2000));

            toast.success("Vault poked successfully!", {
                description: "Rewards have been distributed.",
            });

            return "simulated_tx_hash";
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Poke failed");
            setError(error);
            toast.error("Failed to poke vault", {
                description: error.message,
            });
            throw error;
        } finally {
            setIsPending(false);
        }
    }, [vaultAddress]);

    return {
        poke,
        isPending,
        error,
    };
}

/**
 * Calculate poker reward (1% of pending rewards)
 */
export function calculatePokerReward(pendingRewards: number): number {
    return pendingRewards * 0.01;
}

/**
 * Calculate creator reward (60% of pending rewards)
 */
export function calculateCreatorReward(pendingRewards: number): number {
    return pendingRewards * 0.6;
}

/**
 * Calculate protocol reward (39% of pending rewards)
 */
export function calculateProtocolReward(pendingRewards: number): number {
    return pendingRewards * 0.39;
}
