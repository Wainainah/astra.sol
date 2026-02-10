/**
 * GET /api/tokens/[address]
 * 
 * Get single token details with graduation gates.
 * 
 * Returns TokenDetailResponse including:
 * - Full token data
 * - Graduation gates status
 * - Calculated market cap from total_sol * sol_price
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { launches, positions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { 
  TokenDetailResponse, 
  TokenStatus,
  GraduationGates
} from "@/lib/api-types";
import { 
  getSolPriceUsd, 
  calculateGraduationProgress 
} from "@/lib/price-cache";
import { 
  GRADUATION_MARKET_CAP_USD,
  GRADUATION_MIN_HOLDERS,
  GRADUATION_MAX_CONCENTRATION_BPS,
  BPS_DENOMINATOR
} from "@/lib/constants";

interface RouteParams {
  params: Promise<{ address: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { address } = await params;
    
    if (!address) {
      return NextResponse.json(
        { error: "Token address is required" },
        { status: 400 }
      );
    }
    
    // Fetch token
    const launchResult = await db
      .select()
      .from(launches)
      .where(eq(launches.address, address))
      .limit(1);
    
    if (launchResult.length === 0) {
      return NextResponse.json(
        { error: "Token not found" },
        { status: 404 }
      );
    }
    
    const launch = launchResult[0];
    
    // Fetch active holders for graduation gate calculation
    const holdersResult = await db
      .select({
        userAddress: positions.userAddress,
        shares: positions.shares,
        lockedShares: positions.lockedShares,
      })
      .from(positions)
      .where(
        and(
          eq(positions.launchAddress, address),
          sql`(${positions.shares} + COALESCE(${positions.lockedShares}, 0)) > 0`
        )
      );
    
    // Calculate graduation gates
    const activeHolders = holdersResult.filter(
      (h) => Number(h.shares) > 0 || Number(h.lockedShares) > 0
    );
    const holderCount = activeHolders.length;
    const totalShares = Number(launch.totalShares);
    
    // Calculate concentration (top holder %)
    const maxHolderShares = activeHolders.length > 0
      ? Math.max(...activeHolders.map((h) => Number(h.shares) + Number(h.lockedShares)))
      : 0;
    const concentrationBps = totalShares > 0 
      ? (maxHolderShares / totalShares) * BPS_DENOMINATOR 
      : 0;
    
    // Check each gate
    const marketCapUsd = Number(launch.marketCapUsd);
    const marketCapMet = marketCapUsd >= GRADUATION_MARKET_CAP_USD;
    const holdersMet = holderCount >= GRADUATION_MIN_HOLDERS;
    const concentrationMet = concentrationBps <= GRADUATION_MAX_CONCENTRATION_BPS;
    
    // Build blocking reasons
    const blockingReasons: string[] = [];
    if (!marketCapMet) {
      const remaining = GRADUATION_MARKET_CAP_USD - marketCapUsd;
      blockingReasons.push(
        `Market cap $${marketCapUsd.toLocaleString()} / $${GRADUATION_MARKET_CAP_USD.toLocaleString()} (need $${remaining.toLocaleString()} more)`
      );
    }
    if (!holdersMet) {
      const needed = GRADUATION_MIN_HOLDERS - holderCount;
      blockingReasons.push(
        `Holders ${holderCount} / ${GRADUATION_MIN_HOLDERS} (need ${needed} more)`
      );
    }
    if (!concentrationMet) {
      blockingReasons.push(
        `Concentration ${(concentrationBps / 100).toFixed(1)}% / 10% (top holder too large)`
      );
    }
    
    const graduationGates: GraduationGates = {
      marketCapUsd,
      marketCapTarget: GRADUATION_MARKET_CAP_USD,
      holders: holderCount,
      holdersTarget: GRADUATION_MIN_HOLDERS,
      concentration: concentrationBps,
      concentrationTarget: GRADUATION_MAX_CONCENTRATION_BPS,
      canGraduate: marketCapMet && holdersMet && concentrationMet,
      blockingReasons,
    };
    
    // Determine status
    let status: TokenStatus = "active";
    if (launch.graduated) {
      status = "graduated";
    } else if (launch.refundMode) {
      status = "refunding";
    }
    
    // Calculate age
    const now = new Date();
    const createdAt = launch.createdAt;
    const ageHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    const response: TokenDetailResponse = {
      address: launch.address,
      name: launch.name,
      ticker: launch.symbol,
      creator: launch.creator,
      totalShares: Number(launch.totalShares),
      totalSol: Number(launch.totalSol),
      marketCapUsd,
      graduationProgress: calculateGraduationProgress(marketCapUsd),
      graduationTarget: GRADUATION_MARKET_CAP_USD,
      holders: holderCount,
      topHolderPct: concentrationBps / 100,
      status,
      createdAt: createdAt.toISOString(),
      ageHours: Math.floor(ageHours * 10) / 10,
      graduatedToken: launch.tokenMint ?? undefined,
      vault: launch.vault ?? undefined,
      image: launch.image ?? undefined,
      creatorSeedShares: Number(launch.creatorSeedShares),
      uri: launch.uri,
      graduationGates,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching token details:", error);
    return NextResponse.json(
      { error: "Failed to fetch token details" },
      { status: 500 }
    );
  }
}
