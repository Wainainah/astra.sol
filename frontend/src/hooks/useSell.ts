/**
 * useSell Hook - Astra Protocol V7
 * 
 * Handles selling shares on the bonding curve.
 * Calculates proportional refund (not current value) and shows warning
 * about leaving money on the table.
 */

import { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";

import { sellReturn, getSellQuote, getPositionValue } from "@/lib/curve";
import type { SellQuote, Position } from "@/lib/api-types";

export interface UseSellOptions {
  programId?: string;
}

export interface SellResult {
  signature: string;
  refundAmount: number; // In lamports
  refundAmountUsd: number;
  sharesSold: number;
}

export interface UseSellResult {
  // State
  isPending: boolean;
  error: Error | null;
  result: SellResult | null;
  quote: SellQuote | null;
  warning: {
    severity: "info" | "warning" | "critical";
    title: string;
    message: string;
    leavingBehindSol: number;
    leavingBehindUsd: number;
  } | null;

  // Actions
  calculateRefund: (
    sharesToSell: number,
    userShares: number,
    userBasis: number
  ) => number;
  getQuote: (
    sharesToSell: number,
    position: Position,
    currentTotalShares: number,
    solPriceUsd: number
  ) => SellQuote;
  sell: (tokenAddress: string, sharesToSell: number, position: Position) => Promise<SellResult>;
  reset: () => void;
}

const DEFAULT_PROGRAM_ID = "Astra1aunch11111111111111111111111111111111";

export function useSell(options: UseSellOptions = {}): UseSellResult {
  const { programId = DEFAULT_PROGRAM_ID } = options;
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, signTransaction } = wallet;

  // State
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<SellResult | null>(null);
  const [quote, setQuote] = useState<SellQuote | null>(null);
  const [warning, setWarning] = useState<UseSellResult["warning"]>(null);

  /**
   * Calculate proportional refund for selling shares
   * Note: This is NOT current position value - it's proportional to original basis
   */
  const calculateRefund = useCallback(
    (sharesToSell: number, userShares: number, userBasis: number): number => {
      if (sharesToSell <= 0 || userShares <= 0 || userBasis <= 0) return 0;
      return sellReturn(sharesToSell, userShares, userBasis);
    },
    []
  );

  /**
   * Get comprehensive sell quote including warning about leaving money on table
   */
  const getQuote = useCallback(
    (
      sharesToSell: number,
      position: Position,
      currentTotalShares: number,
      solPriceUsd: number
    ): SellQuote => {
      const sellQuoteResult = getSellQuote(
        sharesToSell,
        position.shares,
        position.solBasis,
        currentTotalShares,
        solPriceUsd
      );

      // Convert to API SellQuote format
      const apiQuote: SellQuote = {
        sharesToSell: sellQuoteResult.sharesToSell,
        refundAmount: sellQuoteResult.refundAmount,
        leavingBehind: sellQuoteResult.leavingBehind,
        leavingBehindUsd: sellQuoteResult.leavingBehindUsd,
        warning: sellQuoteResult.warning?.message || "",
      };

      // Set warning state for UI display
      if (sellQuoteResult.warning) {
        setWarning({
          severity: sellQuoteResult.warning.severity,
          title: sellQuoteResult.warning.title,
          message: sellQuoteResult.warning.message,
          leavingBehindSol: sellQuoteResult.warning.leavingBehindSol,
          leavingBehindUsd: sellQuoteResult.warning.leavingBehindUsd,
        });
      } else {
        setWarning(null);
      }

      setQuote(apiQuote);
      return apiQuote;
    },
    []
  );

  /**
   * Execute sell transaction
   */
  const sell = useCallback(
    async (
      tokenAddress: string,
      sharesToSell: number,
      position: Position
    ): Promise<SellResult> => {
      if (!publicKey || !signTransaction) {
        throw new Error("Wallet not connected");
      }

      if (sharesToSell <= 0) {
        throw new Error("Shares to sell must be greater than 0");
      }

      if (sharesToSell > position.shares) {
        throw new Error("Cannot sell more shares than owned");
      }

      setIsPending(true);
      setError(null);
      setResult(null);

      try {
        const tokenPubkey = new PublicKey(tokenAddress);

        // Calculate expected refund
        const refundAmount = sellReturn(
          sharesToSell,
          position.shares,
          position.solBasis
        );

        // Build transaction
        const transaction = new Transaction();

        // Create sell instruction
        const sellInstruction = await createSellInstruction(
          programId,
          tokenPubkey,
          publicKey,
          sharesToSell,
          refundAmount // minRefund for slippage protection
        );

        transaction.add(sellInstruction);

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

        const sellResult: SellResult = {
          signature: sig,
          refundAmount,
          refundAmountUsd: 0, // Would calculate from solPriceUsd
          sharesSold: sharesToSell,
        };

        setResult(sellResult);
        return sellResult;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Sell transaction failed");
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
    setResult(null);
    setQuote(null);
    setWarning(null);
  }, []);

  return {
    isPending,
    error,
    result,
    quote,
    warning,
    calculateRefund,
    getQuote,
    sell,
    reset,
  };
}

/**
 * Create sell instruction (placeholder - would use IDL in production)
 */
async function createSellInstruction(
  programId: string,
  launch: PublicKey,
  seller: PublicKey,
  shares: number,
  minRefund: number
): Promise<any> {
  // This would be generated from the Anchor IDL
  // Placeholder implementation
  return {
    keys: [
      { pubkey: launch, isSigner: false, isWritable: true },
      { pubkey: seller, isSigner: true, isWritable: true },
    ],
    programId: new PublicKey(programId),
    data: Buffer.from([1, ...new BN(shares).toArray("le", 8)]),
  };
}
