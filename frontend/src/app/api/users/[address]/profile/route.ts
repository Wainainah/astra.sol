/**
 * POST /api/users/[address]/profile
 *
 * Create or update user profile
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isValidSolanaAddress } from "@/lib/solana-utils";

interface RouteParams {
  params: Promise<{ address: string }>;
}

interface UpdateProfileRequest {
  username?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  twitter?: string;
}

// Reserved usernames that cannot be used
const RESERVED_USERNAMES = [
  "admin",
  "support",
  "help",
  "astra",
  "solana",
  "official",
  "mod",
  "moderator",
  "team",
  "staff",
  "founder",
  "ceo",
  "root",
  "system",
  "api",
  "webhook",
  "test",
  "demo",
];

// Username validation regex: 3-32 chars, alphanumeric + underscore, must start with letter
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{2,31}$/;

function validateUsername(username: string): {
  valid: boolean;
  error?: string;
} {
  // Check length
  if (username.length < 3 || username.length > 32) {
    return { valid: false, error: "Username must be 3-32 characters" };
  }

  // Check format
  if (!USERNAME_REGEX.test(username)) {
    return {
      valid: false,
      error:
        "Username must start with a letter and contain only letters, numbers, and underscores",
    };
  }

  // Check reserved words
  if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
    return { valid: false, error: "This username is reserved" };
  }

  // Check consecutive underscores
  if (username.includes("__")) {
    return {
      valid: false,
      error: "Username cannot contain consecutive underscores",
    };
  }

  // Check start/end with underscore
  if (username.startsWith("_") || username.endsWith("_")) {
    return {
      valid: false,
      error: "Username cannot start or end with underscore",
    };
  }

  return { valid: true };
}

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { address } = await params;

    // Validate Solana address
    if (!address || !isValidSolanaAddress(address)) {
      return NextResponse.json(
        { error: "Invalid Solana address format" },
        { status: 400 },
      );
    }

    // Parse request body
    const body: UpdateProfileRequest = await request.json();

    // Validate username if provided
    if (body.username !== undefined) {
      const usernameValidation = validateUsername(body.username);
      if (!usernameValidation.valid) {
        return NextResponse.json(
          { error: usernameValidation.error },
          { status: 400 },
        );
      }

      // Check if username is already taken by another user
      const existingUser = await db
        .select({ address: users.address })
        .from(users)
        .where(eq(users.username, body.username.toLowerCase()))
        .limit(1);

      if (existingUser.length > 0 && existingUser[0].address !== address) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 },
        );
      }

      // Convert to lowercase for storage
      body.username = body.username.toLowerCase();
    }

    // Validate display name if provided
    if (body.displayName !== undefined && body.displayName.length > 50) {
      return NextResponse.json(
        { error: "Display name must be 50 characters or less" },
        { status: 400 },
      );
    }

    // Validate bio if provided
    if (body.bio !== undefined && body.bio.length > 280) {
      return NextResponse.json(
        { error: "Bio must be 280 characters or less" },
        { status: 400 },
      );
    }

    // Validate twitter handle if provided
    if (body.twitter !== undefined) {
      // Remove @ if present
      body.twitter = body.twitter.replace(/^@/, "");

      if (body.twitter.length > 50) {
        return NextResponse.json(
          { error: "Twitter handle must be 50 characters or less" },
          { status: 400 },
        );
      }
    }

    // Upsert user profile
    await db
      .insert(users)
      .values({
        address,
        username: body.username || null,
        displayName: body.displayName || null,
        bio: body.bio || null,
        avatarUrl: body.avatarUrl || null,
        twitter: body.twitter || null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.address,
        set: {
          username: body.username !== undefined ? body.username : undefined,
          displayName:
            body.displayName !== undefined ? body.displayName : undefined,
          bio: body.bio !== undefined ? body.bio : undefined,
          avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : undefined,
          twitter: body.twitter !== undefined ? body.twitter : undefined,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Failed to update user profile:", error);

    return NextResponse.json(
      {
        error: "Failed to update user profile",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
