/**
 * GET /api/users/[address]
 *
 * Get user profile summary.
 * Note: No separate users table - derives stats from positions and transactions.
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import { positions, transactions } from "@/db/schema";
import { eq, sql, min, max, countDistinct, and, gt } from "drizzle-orm";
import { isValidSolanaAddress } from "@/lib/solana-utils";
import type { User } from "@/lib/api-types";

interface RouteParams {
  params: { address: string };
}

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { address } = params;

    // Validate Solana address
    if (!address || !isValidSolanaAddress(address)) {
      return NextResponse.json(
        { error: "Invalid Solana address format" },
        { status: 400 },
      );
    }

    // Count distinct launches the user has positions in
    const positionStats = await db
      .select({
        totalLaunches: countDistinct(positions.launchAddress),
      })
      .from(positions)
      .where(eq(positions.userAddress, address));

    // Count active positions (positions with shares > 0)
    const activePositionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(positions)
      .where(
        and(
          eq(positions.userAddress, address),
          gt(positions.shares, BigInt(0)),
        ),
      );

    // Get first and last activity from transactions
    const activityStats = await db
      .select({
        firstSeenAt: min(transactions.blockTime),
        lastSeenAt: max(transactions.blockTime),
        txCount: sql<number>`count(*)`,
      })
      .from(transactions)
      .where(eq(transactions.userAddress, address));

    const totalLaunches = positionStats[0]?.totalLaunches || 0;
    const activePositions = activePositionsResult[0]?.count || 0;
    const firstSeenAt = activityStats[0]?.firstSeenAt;
    const lastSeenAt = activityStats[0]?.lastSeenAt;
    const txCount = activityStats[0]?.txCount || 0;

    // If user has no activity, return 404
    if (totalLaunches === 0 && txCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const response: User = {
      address,
      firstSeenAt: firstSeenAt?.toISOString() || null,
      lastSeenAt: lastSeenAt?.toISOString() || null,
      totalTokens: totalLaunches,
      activePositions,
      totalTransactions: txCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch user:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch user",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
