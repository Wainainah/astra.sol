/**
 * useClaim Hook (V7)
 * 
 * Claims graduated tokens for users.
 * V7 uses proportional distribution: tokens = (userShares / totalSharesAtGraduation) * 800M
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

export interface UseClaimOptions {
  launchAddress: string | undefined;
  tokenMint: string | undefined;
}

export interface UseClaimResult {
  claim: () => Promise<string | undefined>;
  isPending: boolean;
}

/**
 * Hook for claiming graduated tokens
 * 
 * V7: Uses proportional distribution based on shares at graduation time.
 * The on-chain program calculates: tokens = (userShares / totalSharesAtGraduation) * 800M
 * 
 * @example
 * ```tsx
 * const { claim, isPending } = useClaim({
 *   launchAddress: "...",
 *   tokenMint: "..."
 * });
 * 
 * await claim();
 * ```
 */
export function useClaim({
  launchAddress,
  tokenMint,
}: UseClaimOptions): UseClaimResult {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, signTransaction } = wallet;
  const [isPending, setIsPending] = useState(false);

  const claim = useCallback(async (): Promise<string | undefined> => {
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

      toast.success("Tokens claimed!", {
        description: "Your proportional share of tokens has been transferred to your wallet",
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
      toast.error("Wallet not connected or launch not found");
      return;
    }

    try {
      setIsPending(true);

      // Build claim transaction
      // Note: In production, this would use the actual Anchor program
      const transaction = new Transaction();
      
      // Create claim instruction
      // This is a placeholder - actual implementation would use the IDL
      const claimInstruction = await createClaimInstruction(
        launchAddress,
        tokenMint,
        publicKey.toBase58()
      );

      transaction.add(claimInstruction);

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

      toast.success("Tokens claimed!", {
        description: `Tx: ${sig.slice(0, 8)}...`,
      });
      return sig;
    } catch (err: unknown) {
      console.error("Claim failed:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (!errorMessage.includes("User rejected") && !errorMessage.includes("cancelled")) {
        toast.error("Claim failed", {
          description: errorMessage,
        });
      }
      return undefined;
    } finally {
      setIsPending(false);
    }
  }, [connection, publicKey, signTransaction, launchAddress, tokenMint]);

  return {
    claim,
    isPending,
  };
}

/**
 * Create claim instruction (placeholder - would use IDL in production)
 */
async function createClaimInstruction(
  launchAddress: string,
  tokenMint: string,
  userAddress: string
): Promise<any> {
  // This would be generated from the Anchor IDL
  // For now, returning a placeholder
  console.log("Creating claim instruction for:", {
    launchAddress,
    tokenMint,
    userAddress,
  });
  // Placeholder - would create actual Anchor instruction
  throw new Error("Claim instruction not yet implemented - requires IDL");
}
