/**
 * GET /api/portfolio/[address]
 * 
 * Get user portfolio with position values calculated using curve.
 * 
 * Returns PortfolioResponse including:
 * - Summary with total value, cost basis, P&L
 * - Holdings with individual position values
 * - Graduation estimates for each position
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { launches, positions, transactions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { 
  PortfolioResponse, 
  PortfolioHolding,
  TokenStatus
} from "@/lib/api-types";
import { getSolPriceUsd } from "@/lib/price-cache";
import { 
  getPositionValue, 
  estimateTokensAtGraduation,
} from "@/lib/curve";

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
        launchTotalShares: launches.totalShares,
        launchTotalSol: launches.totalSol,
        launchGraduated: launches.graduated,
        launchRefundMode: launches.refundMode,
        launchTokenMint: launches.tokenMint,
        launchTotalSharesAtGraduation: launches.totalSharesAtGraduation,
      })
      .from(positions)
      .innerJoin(launches, eq(positions.launchAddress, launches.address))
      .where(
        and(
          eq(positions.userAddress, address),
          sql`(${positions.shares} + COALESCE(${positions.lockedShares}, 0)) > 0`
        )
      );
    
    // Fetch trade counts for summary
    const tradeCounts = await db
      .select({
        type: transactions.type,
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(eq(transactions.userAddress, address))
      .groupBy(transactions.type);
    
    const buyCount = tradeCounts.find(t => t.type === "buy")?.count ?? 0;
    const sellCount = tradeCounts.find(t => t.type === "sell")?.count ?? 0;
    
    // Calculate holdings
    let totalValueSol = 0;
    let totalCostBasisSol = 0;
    let totalUnrealizedPnlSol = 0;
    let realizedPnlSol = 0;
    
    const holdings: PortfolioHolding[] = positionsResult.map((pos) => {
      const shares = Number(pos.shares);
      const lockedShares = Number(pos.lockedShares ?? 0);
      const totalHolderShares = shares + lockedShares;
      const solBasis = Number(pos.solBasis);
      const totalShares = Number(pos.launchTotalShares);
      
      // Determine status
      let status: TokenStatus = "active";
      if (pos.launchGraduated) {
        status = "graduated";
      } else if (pos.launchRefundMode) {
        status = "refunding";
      }
      
      // Calculate position value
      const positionValueSol = status === "active" 
        ? getPositionValue(shares, totalShares) 
        : 0;
      const positionValueUsd = (positionValueSol * solPriceUsd) / 1e9;
      
      // Cost basis
      const costBasisSol = solBasis;
      const _costBasisUsd = (costBasisSol * solPriceUsd) / 1e9;
      
      // Unrealized P&L
      const unrealizedPnlSol = positionValueSol - costBasisSol;
      const unrealizedPnlUsd = (unrealizedPnlSol * solPriceUsd) / 1e9;
      const unrealizedPnlPercent = costBasisSol > 0 
        ? (unrealizedPnlSol / costBasisSol) * 100 
        : 0;
      
      // Ownership percentage
      const ownershipPercent = totalShares > 0 
        ? (totalHolderShares / totalShares) * 100 
        : 0;
      
      // Graduation estimate
      const totalSharesAtGraduation = Number(pos.launchTotalSharesAtGraduation);
      const estimatedTokensAtGraduation = totalSharesAtGraduation > 0
        ? estimateTokensAtGraduation(totalHolderShares, totalSharesAtGraduation)
        : estimateTokensAtGraduation(totalHolderShares, totalShares);
      
      // Accumulate totals
      totalValueSol += positionValueSol;
      totalCostBasisSol += costBasisSol;
      totalUnrealizedPnlSol += unrealizedPnlSol;
      
      return {
        launchAddress: pos.launchAddress,
        tokenName: pos.launchName,
        tokenSymbol: pos.launchSymbol,
        tokenImage: pos.launchImage,
        shares: totalHolderShares,
        solBasis: costBasisSol,
        positionValueSol,
        positionValueUsd,
        unrealizedPnlSol,
        unrealizedPnlUsd,
        unrealizedPnlPercent,
        ownershipPercent,
        hasClaimedTokens: pos.hasClaimedTokens,
        hasClaimedRefund: pos.hasClaimedRefund,
        firstBuyAt: pos.firstBuyAt?.toISOString() ?? null,
        lastUpdatedAt: pos.lastUpdatedAt?.toISOString() ?? null,
        graduated: pos.launchGraduated,
        refundMode: pos.launchRefundMode,
        estimatedTokensAtGraduation,
      };
    });
    
    // Sort by value descending
    holdings.sort((a, b) => b.positionValueSol - a.positionValueSol);
    
    // Calculate summary
    const totalValueUsd = (totalValueSol * solPriceUsd) / 1e9;
    const totalCostBasisUsd = (totalCostBasisSol * solPriceUsd) / 1e9;
    const totalUnrealizedPnlUsd = (totalUnrealizedPnlSol * solPriceUsd) / 1e9;
    const totalUnrealizedPnlPercent = totalCostBasisSol > 0 
      ? (totalUnrealizedPnlSol / totalCostBasisSol) * 100 
      : 0;
    
    const response: PortfolioResponse = {
      summary: {
        totalValueSol,
        totalValueUsd,
        totalCostBasisSol,
        totalCostBasisUsd,
        totalUnrealizedPnlSol,
        totalUnrealizedPnlUsd,
        totalUnrealizedPnlPercent,
        realizedPnlSol,
        totalPositions: holdings.length,
        activePositions: holdings.filter(h => !h.graduated && !h.refundMode).length,
        totalTrades: {
          buys: buyCount,
          sells: sellCount,
        },
      },
      holdings,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio" },
      { status: 500 }
    );
  }
}
