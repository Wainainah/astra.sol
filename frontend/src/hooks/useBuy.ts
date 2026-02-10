/**
 * useBuy Hook - Astra Protocol V7
 * 
 * Handles buying shares on the bonding curve.
 * Calculates shares using the curve and submits the transaction.
 */

import { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

import { buyReturn, getBuyQuote } from "@/lib/curve";
import type { CurveQuote } from "@/lib/api-types";

export interface UseBuyOptions {
  programId?: string;
  launchAddress?: string;
}

export interface UseBuyResult {
  // State
  isPending: boolean;
  error: Error | null;
  signature: string | null;
  quote: CurveQuote | null;
  
  // Actions
  calculateShares: (solAmount: number, currentSupply: number) => number;
  getQuote: (
    solAmount: number,
    currentTotalShares: number,
    currentUserShares: number,
    solPriceUsd: number
  ) => CurveQuote;
  buy: (
    tokenAddress: string,
    solAmount: number,
    minSharesOut?: number
  ) => Promise<string>;
  reset: () => void;
}

const DEFAULT_PROGRAM_ID = "Astra1aunch11111111111111111111111111111111";

export function useBuy(options: UseBuyOptions = {}): UseBuyResult {
  const { programId = DEFAULT_PROGRAM_ID } = options;
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, signTransaction } = wallet;

  // State
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [quote, setQuote] = useState<CurveQuote | null>(null);

  /**
   * Calculate shares for a given SOL amount using the bonding curve
   */
  const calculateShares = useCallback(
    (solAmount: number, currentSupply: number): number => {
      if (solAmount <= 0 || currentSupply < 0) return 0;
      // Convert SOL to lamports for calculation
      const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);
      return buyReturn(lamports, currentSupply);
    },
    []
  );

  /**
   * Get comprehensive buy quote including market cap and graduation progress
   */
  const getQuote = useCallback(
    (
      solAmount: number,
      currentTotalShares: number,
      currentUserShares: number,
      solPriceUsd: number
    ): CurveQuote => {
      const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);
      const result = getBuyQuote(
        lamports,
        currentTotalShares,
        currentUserShares,
        solPriceUsd
      );

      const curveQuote: CurveQuote = {
        solAmount: lamports,
        sharesOut: result.sharesOut,
        pricePerShare: result.pricePerShare,
        pricePerShareUsd: result.pricePerShareUsd,
        marketCapAfter: result.marketCapAfterUsd,
        graduationProgressAfter: result.graduationProgressAfter,
      };

      setQuote(curveQuote);
      return curveQuote;
    },
    []
  );

  /**
   * Execute buy transaction
   */
  const buy = useCallback(
    async (
      tokenAddress: string,
      solAmount: number,
      minSharesOut?: number
    ): Promise<string> => {
      if (!publicKey || !signTransaction) {
        throw new Error("Wallet not connected");
      }

      if (solAmount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      setIsPending(true);
      setError(null);
      setSignature(null);

      try {
        const tokenPubkey = new PublicKey(tokenAddress);
        const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

        // Build transaction
        // Note: In production, this would use the actual Anchor program
        const transaction = new Transaction();

        // Add compute budget for complex curve calculations
        // ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 })
        // This would be added in production

        // Create buy instruction
        // This is a placeholder - actual implementation would use the IDL
        const buyInstruction = await createBuyInstruction(
          programId,
          tokenPubkey,
          publicKey,
          lamports,
          minSharesOut || 0
        );

        transaction.add(buyInstruction);

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

        setSignature(sig);
        return sig;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Transaction failed");
        setError(error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [connection, publicKey, signTransaction, programId]
  );

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setIsPending(false);
    setError(null);
    setSignature(null);
    setQuote(null);
  }, []);

  return {
    isPending,
    error,
    signature,
    quote,
    calculateShares,
    getQuote,
    buy,
    reset,
  };
}

/**
 * Create buy instruction (placeholder - would use IDL in production)
 */
async function createBuyInstruction(
  programId: string,
  launch: PublicKey,
  buyer: PublicKey,
  lamports: number,
  minSharesOut: number
): Promise<any> {
  // This would be generated from the Anchor IDL
  // For now, returning a placeholder SystemProgram transfer as a stub
  return SystemProgram.transfer({
    fromPubkey: buyer,
    toPubkey: launch,
    lamports,
  });
}
