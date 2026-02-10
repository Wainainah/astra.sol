/**
 * GET /api/tokens
 * 
 * List tokens with pagination and sorting.
 * 
 * Query params:
 * - status: "active" | "graduated" | "refunding"
 * - sort: "newest" | "oldest" | "most_funded" | "closest_to_graduation"
 * - limit: number (default: 20, max: 100)
 * - offset: number (default: 0)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { launches } from "@/db/schema";
import { desc, asc, eq, and, count } from "drizzle-orm";
import { 
  TokenListResponse, 
  Token, 
  TokenStatus, 
  TokenQueryParams 
} from "@/lib/api-types";
import { 
  getSolPriceUsd, 
  calculateGraduationProgress 
} from "@/lib/price-cache";
import { GRADUATION_MARKET_CAP_USD } from "@/lib/constants";

// Default pagination values
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const status = searchParams.get("status") as TokenStatus | null;
    const sort = searchParams.get("sort") as TokenQueryParams["sort"] ?? "newest";
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10),
      MAX_LIMIT
    );
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);
    
    // Get SOL price for USD calculations
    const _solPriceUsd = await getSolPriceUsd();
    
    // Build WHERE conditions
    const conditions = [];
    
    if (status === "active") {
      conditions.push(eq(launches.graduated, false));
      conditions.push(eq(launches.refundMode, false));
    } else if (status === "graduated") {
      conditions.push(eq(launches.graduated, true));
    } else if (status === "refunding") {
      conditions.push(eq(launches.refundMode, true));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Build ORDER BY based on sort parameter
    let orderBy;
    switch (sort) {
      case "oldest":
        orderBy = asc(launches.createdAt);
        break;
      case "most_funded":
        orderBy = desc(launches.totalSol);
        break;
      case "closest_to_graduation":
        // Order by market cap descending (closest to $42K first)
        orderBy = desc(launches.marketCapUsd);
        break;
      case "newest":
      default:
        orderBy = desc(launches.createdAt);
    }
    
    // Fetch total count for pagination
    const countResult = await db
      .select({ count: count() })
      .from(launches)
      .where(whereClause);
    
    const total = Number(countResult[0]?.count ?? 0);
    
    // Fetch tokens
    const results = await db
      .select()
      .from(launches)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);
    
    // Transform to Token interface
    const now = new Date();
    const tokens: Token[] = results.map((launch) => {
      const createdAt = launch.createdAt;
      const ageHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      // Calculate market cap and graduation progress
      const marketCapUsd = Number(launch.marketCapUsd);
      const graduationProgress = calculateGraduationProgress(marketCapUsd);
      
      // Determine status
      let tokenStatus: TokenStatus = "active";
      if (launch.graduated) {
        tokenStatus = "graduated";
      } else if (launch.refundMode) {
        tokenStatus = "refunding";
      }
      
      return {
        address: launch.address,
        name: launch.name,
        ticker: launch.symbol,
        creator: launch.creator,
        totalShares: Number(launch.totalShares),
        totalSol: Number(launch.totalSol),
        marketCapUsd,
        graduationProgress,
        graduationTarget: GRADUATION_MARKET_CAP_USD,
        holders: launch.graduationGateHolders ?? 0,
        topHolderPct: (launch.graduationGateConcentration ?? 0) / 100,
        status: tokenStatus,
        createdAt: createdAt.toISOString(),
        ageHours: Math.floor(ageHours * 10) / 10,
        graduatedToken: launch.tokenMint ?? undefined,
        vault: launch.vault ?? undefined,
        image: launch.image ?? undefined,
      };
    });
    
    const response: TokenListResponse = {
      tokens,
      total,
      hasMore: offset + tokens.length < total,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return NextResponse.json(
      { error: "Failed to fetch tokens" },
      { status: 500 }
    );
  }
}
