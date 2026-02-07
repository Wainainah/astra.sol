/**
 * useClaimVesting Hook (V7)
 *
 * Claims vested tokens for the creator.
 * Only works for graduated tokens where the creator has unlocked vesting shares.
 * 
 * V7: Creator vesting uses lockedShares which unlock linearly over 42 days.
 * The claim amount is calculated on-chain based on vested portion.
 */

import { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { toast } from "sonner";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

// Generate fake tx signature for mock mode
function generateMockTxSignature(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  return Array.from({ length: 88 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}

export interface UseClaimVestingOptions {
  launchAddress: string | undefined;
  tokenMint: string | undefined;
}

export interface UseClaimVestingResult {
  claimVesting: () => Promise<string | undefined>;
  isPending: boolean;
}

/**
 * Hook for claiming vested tokens as a creator
 * 
 * V7: Creator's lockedShares vest linearly over 42 days after graduation.
 * Vesting formula: unlocked = lockedShares * daysElapsed / 42
 * Token calculation: tokens = (vestedShares / totalSharesAtGraduation) * 800M
 * 
 * @example
 * ```tsx
 * const { claimVesting, isPending } = useClaimVesting({
 *   launchAddress: "...",
 *   tokenMint: "..."
 * });
 *
 * await claimVesting();
 * ```
 */
export function useClaimVesting({
  launchAddress,
  tokenMint,
}: UseClaimVestingOptions): UseClaimVestingResult {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, signTransaction } = wallet;
  const [isPending, setIsPending] = useState(false);

  const claimVesting = useCallback(async (): Promise<string | undefined> => {
    // Mock mode - simulate a successful transaction
    if (USE_MOCK) {
      if (!publicKey) {
        toast.error("Please connect your wallet first");
        return;
      }

      setIsPending(true);
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockTx = generateMockTxSignature();

      toast.success("Vested tokens claimed!", {
        description: "Your unlocked creator tokens have been transferred to your wallet",
        action: {
          label: "View (Mock)",
          onClick: () =>
            toast.info("Mock transaction - no on-chain record", {
              description: `Mock Tx: ${mockTx.slice(0, 8)}...`,
            }),
        },
      });

      setIsPending(false);
      return mockTx;
    }

    // Real mode - execute on-chain transaction
    if (!publicKey || !signTransaction || !launchAddress || !tokenMint) {
      toast.error("Wallet not connected or token data not found");
      return;
    }

    try {
      setIsPending(true);

      // Build claim vesting transaction
      // Note: In production, this would use the actual Anchor program
      const transaction = new Transaction();
      
      // Create claim vesting instruction
      // This is a placeholder - actual implementation would use the IDL
      const claimVestingInstruction = await createClaimVestingInstruction(
        launchAddress,
        tokenMint,
        publicKey.toBase58()
      );

      transaction.add(claimVestingInstruction);

      // Set fee payer and recent blockhash
      transaction.feePayer = publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      // Sign and send
      const signed = await signTransaction(transaction);
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });

      // Wait for confirmation
      await connection.confirmTransaction(sig, "confirmed");

      toast.success("Vested tokens claimed!", {
        description: `Tx: ${sig.slice(0, 8)}...`,
      });

      return sig;
    } catch (err: unknown) {
      console.error("Claim vesting failed:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (!errorMessage.includes("User rejected") && !errorMessage.includes("cancelled")) {
        toast.error("Claim vesting failed", {
          description: errorMessage,
        });
      }
      return undefined;
    } finally {
      setIsPending(false);
    }
  }, [connection, publicKey, signTransaction, launchAddress, tokenMint]);

  return {
    claimVesting,
    isPending,
  };
}

/**
 * Create claim vesting instruction (placeholder - would use IDL in production)
 */
async function createClaimVestingInstruction(
  launchAddress: string,
  tokenMint: string,
  creatorAddress: string
): Promise<any> {
  // This would be generated from the Anchor IDL
  // For now, returning a placeholder
  console.log("Creating claim vesting instruction for:", {
    launchAddress,
    tokenMint,
    creatorAddress,
  });
  // Placeholder - would create actual Anchor instruction
  throw new Error("Claim vesting instruction not yet implemented - requires IDL");
}
