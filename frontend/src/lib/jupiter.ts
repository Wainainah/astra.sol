/**
 * Jupiter Ultra API wrapper for programmatic swaps
 * @see https://station.jup.ag/docs/ultra/api-reference
 *
 * NOTE: For production, API calls should be proxied through server-side routes
 * to protect API keys. The client-side functions here are for development.
 */

const ULTRA_API = "https://api.jup.ag/ultra/v1";
export const SOL_MINT = "So11111111111111111111111111111111111111112";

// API key should be passed from server-side or used in API routes only
// Do NOT use NEXT_PUBLIC_ prefix for API keys in production
const getApiKey = () => {
  // In production, this should be empty - use server-side proxy instead
  if (typeof window !== "undefined") {
    // Client-side: no API key (rate limited but functional)
    return "";
  }
  // Server-side: use private key
  return process.env.JUPITER_API_KEY || "";
};

export interface SwapOrderParams {
  inputMint: string;
  outputMint: string;
  amount: string; // In smallest unit (lamports for SOL, raw tokens)
  taker: string; // Wallet public key
}

export interface SwapOrderResponse {
  requestId: string;
  transaction: string; // Base64 encoded transaction
  inAmount: string;
  outAmount: string;
  error?: string;
}

export interface ExecuteOrderResponse {
  status: "Success" | "Failed" | "Pending";
  signature?: string;
  error?: string;
  transactionError?: string;
}

/**
 * Get a swap order from Jupiter Ultra API
 * Returns an unsigned transaction that the user must sign
 */
export async function getSwapOrder(
  params: SwapOrderParams,
): Promise<SwapOrderResponse> {
  const url = new URL(`${ULTRA_API}/order`);
  url.searchParams.set("inputMint", params.inputMint);
  url.searchParams.set("outputMint", params.outputMint);
  url.searchParams.set("amount", params.amount);
  url.searchParams.set("taker", params.taker);

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const apiKey = getApiKey();
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  const res = await fetch(url.toString(), { headers });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Jupiter API error: ${res.status} - ${errorText}`);
  }

  return res.json();
}

/**
 * Execute a signed swap order
 * Jupiter handles broadcasting and confirmation
 */
export async function executeSwapOrder(
  signedTransaction: string,
  requestId: string,
): Promise<ExecuteOrderResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const apiKey = getApiKey();
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  const res = await fetch(`${ULTRA_API}/execute`, {
    method: "POST",
    headers,
    body: JSON.stringify({ signedTransaction, requestId }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Jupiter execute error: ${res.status} - ${errorText}`);
  }

  return res.json();
}

/**
 * Helper: Convert SOL to lamports
 */
export function solToLamports(sol: number): string {
  return Math.floor(sol * 1e9).toString();
}

/**
 * Helper: Convert lamports to SOL
 */
export function lamportsToSol(lamports: string | number): number {
  return Number(lamports) / 1e9;
}
