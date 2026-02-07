/**
 * GET /api/tokens/[address]/holders
 * 
 * Get token holders ordered by shares DESC.
 * 
 * Returns HoldersResponse including:
 * - List of positions with ownership percentage
 * - Total holder count
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { launches, positions } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { 
  HoldersResponse, 
  Position as ApiPosition,
  TokenStatus
} from "@/lib/api-types";
import { getSolPriceUsd } from "@/lib/price-cache";
import { getPositionValue } from "@/lib/curve";

interface RouteParams {
  params: Promise<{ address: string }>;
}

export async function GET(
  request: NextRequest,
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
    
    // Get SOL price for USD calculations
    const solPriceUsd = await getSolPriceUsd();
    
    // Fetch launch to get total shares
    const launchResult = await db
      .select({
        totalShares: launches.totalShares,
        graduated: launches.graduated,
        refundMode: launches.refundMode,
      })
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
    const totalShares = Number(launch.totalShares);
    
    // Determine token status
    let status: TokenStatus = "active";
    if (launch.graduated) {
      status = "graduated";
    } else if (launch.refundMode) {
      status = "refunding";
    }
    
    // Fetch all holders ordered by total shares DESC
    const holdersResult = await db
      .select({
        launchAddress: positions.launchAddress,
        userAddress: positions.userAddress,
        shares: positions.shares,
        solBasis: positions.solBasis,
        lockedShares: positions.lockedShares,
        hasClaimedTokens: positions.hasClaimedTokens,
        hasClaimedRefund: positions.hasClaimedRefund,
        firstBuyAt: positions.firstBuyAt,
        lastUpdatedAt: positions.lastUpdatedAt,
      })
      .from(positions)
      .where(
        and(
          eq(positions.launchAddress, address),
          sql`(${positions.shares} + COALESCE(${positions.lockedShares}, 0)) > 0`
        )
      )
      .orderBy(desc(sql`${positions.shares} + COALESCE(${positions.lockedShares}, 0)`));
    
    // Transform to Position interface
    const holders: ApiPosition[] = holdersResult.map((holder) => {
      const shares = Number(holder.shares);
      const lockedShares = Number(holder.lockedShares ?? 0);
      const totalHolderShares = shares + lockedShares;
      const solBasis = Number(holder.solBasis);
      
      // Calculate ownership percentage
      const ownershipPercent = totalShares > 0 
        ? (totalHolderShares / totalShares) * 100 
        : 0;
      
      // Calculate position value (what it would cost to buy this position now)
      const positionValue = status === "active" 
        ? getPositionValue(shares, totalShares) 
        : 0;
      const positionValueUsd = (positionValue * solPriceUsd) / 1e9;
      
      // Calculate invested amount
      const invested = solBasis;
      const investedUsd = (invested * solPriceUsd) / 1e9;
      
      // Calculate unrealized gain
      const unrealizedGain = positionValue - invested;
      const unrealizedGainUsd = (unrealizedGain * solPriceUsd) / 1e9;
      
      // Calculate ROI
      const roiPercent = invested > 0 
        ? ((positionValue - invested) / invested) * 100 
        : 0;
      
      return {
        launchAddress: holder.launchAddress,
        userAddress: holder.userAddress,
        shares,
        solBasis,
        lockedShares,
        positionValue,
        positionValueUsd,
        invested,
        investedUsd,
        unrealizedGain,
        unrealizedGainUsd,
        roiPercent,
        ownershipPercent,
        hasClaimedTokens: holder.hasClaimedTokens,
        hasClaimedRefund: holder.hasClaimedRefund,
        firstBuyAt: holder.firstBuyAt?.toISOString() ?? null,
        lastUpdatedAt: holder.lastUpdatedAt?.toISOString() ?? null,
      };
    });
    
    const response: HoldersResponse = {
      holders,
      total: holders.length,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching holders:", error);
    return NextResponse.json(
      { error: "Failed to fetch holders" },
      { status: 500 }
    );
  }
}
