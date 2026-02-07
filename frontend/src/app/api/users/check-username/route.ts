/**
 * GET /api/users/check-username?username=xyz
 *
 * Check if a username is available
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Reserved usernames
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

// Username validation regex
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{2,31}$/;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username parameter is required" },
        { status: 400 },
      );
    }

    const normalizedUsername = username.toLowerCase();

    // Validate format
    if (!USERNAME_REGEX.test(normalizedUsername)) {
      return NextResponse.json({
        available: false,
        error: "Invalid username format",
        rules: {
          minLength: 3,
          maxLength: 32,
          startWithLetter: true,
          allowedChars: "letters, numbers, underscores",
          noConsecutiveUnderscores: true,
          noStartEndUnderscore: true,
        },
      });
    }

    // Check reserved words
    if (RESERVED_USERNAMES.includes(normalizedUsername)) {
      return NextResponse.json({
        available: false,
        error: "This username is reserved",
      });
    }

    // Check if username exists
    const existingUser = await db
      .select({ address: users.address })
      .from(users)
      .where(eq(users.username, normalizedUsername))
      .limit(1);

    if (existingUser.length > 0) {
      // Generate suggestions
      const suggestions = [
        `${normalizedUsername}123`,
        `${normalizedUsername}_sol`,
        `${normalizedUsername}2024`,
        `the_${normalizedUsername}`,
        `${normalizedUsername}_official`,
      ];

      return NextResponse.json({
        available: false,
        error: "Username is already taken",
        suggestions: suggestions.filter((s) => s.length <= 32),
      });
    }

    return NextResponse.json({
      available: true,
      username: normalizedUsername,
    });
  } catch (error) {
    console.error("Failed to check username:", error);

    return NextResponse.json(
      {
        error: "Failed to check username availability",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
