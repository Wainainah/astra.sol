/**
 * POST /api/auth/authenticate
 *
 * Sign-In with Solana (SIWS) authentication
 * Verifies wallet signature and issues JWT
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PublicKey } from "@solana/web3.js";
import { isValidSolanaAddress } from "@/lib/solana-utils";
import { sign } from "tweetnacl";
import bs58 from "bs58";

interface AuthenticateRequest {
  walletAddress: string;
  signature: string;
  message: string;
  timestamp: string;
}

// JWT secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";

// Token expiration: 24 hours
const TOKEN_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function verifySignature(
  message: string,
  signature: string,
  walletAddress: string,
): boolean {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKey = new PublicKey(walletAddress).toBytes();

    return sign.detached.verify(messageBytes, signatureBytes, publicKey);
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}

function isValidTimestamp(timestamp: string): boolean {
  const messageTime = new Date(timestamp).getTime();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  // Message must be from within last 5 minutes
  return messageTime <= now && now - messageTime <= fiveMinutes;
}

function generateJWT(walletAddress: string): string {
  // Simple JWT implementation
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: walletAddress,
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRATION,
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
    "base64url",
  );
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  const signature = sign.detached(
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
    bs58.decode(JWT_SECRET),
  );
  const encodedSignature = bs58.encode(signature);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body: AuthenticateRequest = await request.json();
    const { walletAddress, signature, message, timestamp } = body;

    // Validate required fields
    if (!walletAddress || !signature || !message || !timestamp) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate Solana address
    if (!isValidSolanaAddress(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid Solana address" },
        { status: 400 },
      );
    }

    // Validate timestamp (prevent replay attacks)
    if (!isValidTimestamp(timestamp)) {
      return NextResponse.json(
        { error: "Message timestamp expired or invalid" },
        { status: 400 },
      );
    }

    // Validate message format
    const expectedMessage = `Sign in to Astra Protocol\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`;
    if (message !== expectedMessage) {
      return NextResponse.json(
        { error: "Invalid message format" },
        { status: 400 },
      );
    }

    // Verify signature
    const isValid = verifySignature(message, signature, walletAddress);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Check if user exists
    const userProfile = await db
      .select()
      .from(users)
      .where(eq(users.address, walletAddress))
      .limit(1);

    const isNewUser = userProfile.length === 0;

    // Generate JWT
    const token = generateJWT(walletAddress);

    return NextResponse.json({
      success: true,
      token,
      user: userProfile[0] || { address: walletAddress },
      isNewUser,
    });
  } catch (error) {
    console.error("Authentication failed:", error);

    return NextResponse.json(
      {
        error: "Authentication failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
