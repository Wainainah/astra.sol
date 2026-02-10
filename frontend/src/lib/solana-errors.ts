/**
 * Parse Solana/Anchor errors into human-readable messages
 */

const KNOWN_ERRORS: Record<string, string> = {
  "0x1": "Insufficient funds",
  "0x0": "Unknown error",
  InsufficientFunds: "Insufficient funds for this transaction",
  AccountNotFound: "Account not found on chain",
  InvalidProgramId: "Invalid program ID",
  AccountAlreadyInitialized: "Account already exists",
};

export function parseSolanaError(error: unknown): string {
  if (error instanceof Error) {
    // Check for Anchor custom program errors
    const anchorMatch = error.message.match(/custom program error: (0x[0-9a-fA-F]+)/);
    if (anchorMatch) {
      return KNOWN_ERRORS[anchorMatch[1]] || `Program error: ${anchorMatch[1]}`;
    }

    // Check for known error patterns
    for (const [key, message] of Object.entries(KNOWN_ERRORS)) {
      if (error.message.includes(key)) {
        return message;
      }
    }

    return error.message;
  }

  if (typeof error === "string") return error;
  return "An unknown error occurred";
}
