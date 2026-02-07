/**
 * GET /api/users/[address]/positions
 * 
 * Get user positions (simplified, no locked/unlocked split).
 * 
 * Returns UserPositionsResponse including:
 * - List of positions with token data
 * - Simplified position data (shares, sol_basis only)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { launches, positions } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { 
  UserPositionsResponse, 
  Position as ApiPosition,
  TokenStatus
} from "@/lib/api-types";
import { getSolPriceUsd } from "@/lib/price-cache";
import { getPositionValue } from "@/lib/curve";
import { calculateGraduationProgress } from "@/lib/price-cache";
import { GRADUATION_MARKET_CAP_USD } from "@/lib/constants";

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
        { error: "User address is required" },
        { status: 400 }
      );
    }
    
    // Get SOL price for USD calculations
    const solPriceUsd = await getSolPriceUsd();
    
    // Fetch all positions for user with launch data
    const positionsResult = await db
      .select({
        launchAddress: positions.launchAddress,
        shares: positions.shares,
        solBasis: positions.solBasis,
        lockedShares: positions.lockedShares,
        hasClaimedTokens: positions.hasClaimedTokens,
        hasClaimedRefund: positions.hasClaimedRefund,
        firstBuyAt: positions.firstBuyAt,
        lastUpdatedAt: positions.lastUpdatedAt,
        // Launch data
        launchName: launches.name,
        launchSymbol: launches.symbol,
        launchImage: launches.image,
        launchCreator: launches.creator,
        launchTotalShares: launches.totalShares,
        launchTotalSol: launches.totalSol,
        launchMarketCapUsd: launches.marketCapUsd,
        launchGraduated: launches.graduated,
        launchRefundMode: launches.refundMode,
        launchTokenMint: launches.tokenMint,
        launchVault: launches.vault,
        launchCreatedAt: launches.createdAt,
      })
      .from(positions)
      .innerJoin(launches, eq(positions.launchAddress, launches.address))
      .where(
        and(
          eq(positions.userAddress, address),
          sql`(${positions.shares} + COALESCE(${positions.lockedShares}, 0)) > 0`
        )
      )
      .orderBy(desc(positions.lastUpdatedAt));
    
    // Transform to Position interface
    const now = new Date();
    const positionsList: ApiPosition[] = positionsResult.map((pos) => {
      const shares = Number(pos.shares);
      const lockedShares = Number(pos.lockedShares ?? 0);
      const totalHolderShares = shares + lockedShares;
      const solBasis = Number(pos.solBasis);
      const totalShares = Number(pos.launchTotalShares);
      const marketCapUsd = Number(pos.launchMarketCapUsd);
      
      // Determine status
      let status: TokenStatus = "active";
      if (pos.launchGraduated) {
        status = "graduated";
      } else if (pos.launchRefundMode) {
        status = "refunding";
      }
      
      // Calculate age
      const createdAt = pos.launchCreatedAt;
      const ageHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      // Calculate position value
      const positionValue = status === "active" 
        ? getPositionValue(shares, totalShares) 
        : 0;
      const positionValueUsd = (positionValue * solPriceUsd) / 1e9;
      
      // Calculate invested
      const invested = solBasis;
      const investedUsd = (invested * solPriceUsd) / 1e9;
      
      // Calculate unrealized gain
      const unrealizedGain = positionValue - invested;
      const unrealizedGainUsd = (unrealizedGain * solPriceUsd) / 1e9;
      
      // Calculate ROI
      const roiPercent = invested > 0 
        ? ((positionValue - invested) / invested) * 100 
        : 0;
      
      // Calculate ownership percentage
      const ownershipPercent = totalShares > 0 
        ? (totalHolderShares / totalShares) * 100 
        : 0;
      
      return {
        launchAddress: pos.launchAddress,
        userAddress: address,
        shares: totalHolderShares,
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
        hasClaimedTokens: pos.hasClaimedTokens,
        hasClaimedRefund: pos.hasClaimedRefund,
        firstBuyAt: pos.firstBuyAt?.toISOString() ?? null,
        lastUpdatedAt: pos.lastUpdatedAt?.toISOString() ?? null,
        token: {
          address: pos.launchAddress,
          name: pos.launchName,
          ticker: pos.launchSymbol,
          creator: pos.launchCreator,
          totalShares,
          totalSol: Number(pos.launchTotalSol),
          marketCapUsd,
          graduationProgress: calculateGraduationProgress(marketCapUsd),
          graduationTarget: GRADUATION_MARKET_CAP_USD,
          holders: 0, // Would need separate query
          status,
          createdAt: createdAt.toISOString(),
          ageHours: Math.floor(ageHours * 10) / 10,
          graduatedToken: pos.launchTokenMint ?? undefined,
          vault: pos.launchVault ?? undefined,
          image: pos.launchImage ?? undefined,
        },
      };
    });
    
    const response: UserPositionsResponse = {
      positions: positionsList,
      total: positionsList.length,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching user positions:", error);
    return NextResponse.json(
      { error: "Failed to fetch user positions" },
      { status: 500 }
    );
  }
}
