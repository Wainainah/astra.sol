/**
 * Solana utility functions for address validation and unit conversion.
 */

import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

/**
 * Validate a Solana address (base58 encoded public key).
 * Returns true if valid, false otherwise.
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== "string") {
    return false;
  }

  // Solana addresses are base58 encoded, typically 32-44 characters
  if (address.length < 32 || address.length > 44) {
    return false;
  }

  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse and validate a Solana address, returning the PublicKey.
 * Throws an error if invalid.
 */
export function validateSolanaAddress(address: string): PublicKey {
  if (!address || typeof address !== "string") {
    throw new Error("Address is required");
  }

  try {
    return new PublicKey(address);
  } catch {
    throw new Error("Invalid Solana address format");
  }
}

/**
 * Convert lamports (smallest Solana unit) to SOL.
 * 1 SOL = 1,000,000,000 lamports (1e9)
 */
export function lamportsToSol(lamports: bigint | number | string): number {
  const value = typeof lamports === "bigint" ? lamports : BigInt(lamports);
  return Number(value) / LAMPORTS_PER_SOL;
}

/**
 * Convert SOL to lamports.
 */
export function solToLamports(sol: number): bigint {
  return BigInt(Math.round(sol * LAMPORTS_PER_SOL));
}

/**
 * Format SOL amount for display with appropriate decimal places.
 */
export function formatSol(
  lamports: bigint | number | string,
  decimals = 4,
): string {
  const sol = lamportsToSol(lamports);
  return sol.toFixed(decimals);
}

/**
 * Truncate a Solana address for display (e.g., "9WzD...AWWM").
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!address || address.length <= chars * 2 + 3) {
    return address;
  }
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Get Solana explorer URL for an address or transaction.
 */
export function getSolanaExplorerUrl(
  addressOrTx: string,
  type: "address" | "tx" = "address",
  cluster: "mainnet-beta" | "devnet" | "testnet" = "devnet",
): string {
  const base = "https://explorer.solana.com";
  const clusterParam = cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`;
  return `${base}/${type}/${addressOrTx}${clusterParam}`;
}
