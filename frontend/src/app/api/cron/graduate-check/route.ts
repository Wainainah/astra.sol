/**
 * GET /api/cron/graduate-check
 * 
 * Cron job for checking graduation eligibility.
 * Should be called by Vercel Cron or external scheduler.
 * 
 * Authorization: Requires CRON_SECRET header
 * 
 * For each active launch:
 * - Check graduation gates (market cap, holders, concentration)
 * - If all pass: trigger graduate transaction
 * - Return status report
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { launches, positions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { 
  GRADUATION_MARKET_CAP_USD,
  GRADUATION_MIN_HOLDERS,
  GRADUATION_MAX_CONCENTRATION_BPS,
  BPS_DENOMINATOR,
} from "@/lib/constants";

interface GraduationCheckResult {
  launchAddress: string;
  name: string;
  canGraduate: boolean;
  marketCapMet: boolean;
  holdersMet: boolean;
  concentrationMet: boolean;
  marketCapUsd: number;
  holders: number;
  concentrationBps: number;
  blockingReasons: string[];
  triggered: boolean;
  error?: string;
}

interface GraduationReport {
  checked: number;
  readyToGraduate: number;
  triggered: number;
  errors: number;
  results: GraduationCheckResult[];
  timestamp: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Fetch all active launches (not graduated, not in refund mode)
    const activeLaunches = await db
      .select({
        address: launches.address,
        name: launches.name,
        marketCapUsd: launches.marketCapUsd,
        totalShares: launches.totalShares,
      })
      .from(launches)
      .where(
        and(
          eq(launches.graduated, false),
          eq(launches.refundMode, false)
        )
      );
    
    const results: GraduationCheckResult[] = [];
    let triggered = 0;
    let errors = 0;
    
    // Check each launch
    for (const launch of activeLaunches) {
      try {
        // Fetch holders for this launch
        const holdersResult = await db
          .select({
            shares: positions.shares,
            lockedShares: positions.lockedShares,
          })
          .from(positions)
          .where(
            and(
              eq(positions.launchAddress, launch.address),
              sql`(${positions.shares} + COALESCE(${positions.lockedShares}, 0)) > 0`
            )
          );
        
        // Calculate graduation metrics
        const holderCount = holdersResult.length;
        const totalShares = Number(launch.totalShares);
        
        // Calculate concentration (top holder %)
        const maxHolderShares = holdersResult.length > 0
          ? Math.max(...holdersResult.map((h) => Number(h.shares) + Number(h.lockedShares ?? 0)))
          : 0;
        const concentrationBps = totalShares > 0 
          ? (maxHolderShares / totalShares) * BPS_DENOMINATOR 
          : 0;
        
        const marketCapUsd = Number(launch.marketCapUsd);
        
        // Check gates
        const marketCapMet = marketCapUsd >= GRADUATION_MARKET_CAP_USD;
        const holdersMet = holderCount >= GRADUATION_MIN_HOLDERS;
        const concentrationMet = concentrationBps <= GRADUATION_MAX_CONCENTRATION_BPS;
        const canGraduate = marketCapMet && holdersMet && concentrationMet;
        
        // Build blocking reasons
        const blockingReasons: string[] = [];
        if (!marketCapMet) {
          blockingReasons.push(
            `Market cap $${marketCapUsd.toLocaleString()} / $${GRADUATION_MARKET_CAP_USD.toLocaleString()}`
          );
        }
        if (!holdersMet) {
          blockingReasons.push(
            `Holders ${holderCount} / ${GRADUATION_MIN_HOLDERS}`
          );
        }
        if (!concentrationMet) {
          blockingReasons.push(
            `Concentration ${(concentrationBps / 100).toFixed(1)}% / 10%`
          );
        }
        
        const result: GraduationCheckResult = {
          launchAddress: launch.address,
          name: launch.name,
          canGraduate,
          marketCapMet,
          holdersMet,
          concentrationMet,
          marketCapUsd,
          holders: holderCount,
          concentrationBps,
          blockingReasons,
          triggered: false,
        };
        
        // If ready to graduate, trigger graduation
        if (canGraduate) {
          try {
            // Call the graduate API endpoint or directly invoke graduation logic
            // This would typically call your Solana program
            const graduateSuccess = await triggerGraduation(launch.address);
            result.triggered = graduateSuccess;
            if (graduateSuccess) {
              triggered++;
            }
          } catch (error) {
            result.error = error instanceof Error ? error.message : "Unknown error";
            errors++;
          }
        }
        
        results.push(result);
      } catch (error) {
        console.error(`Error checking launch ${launch.address}:`, error);
        results.push({
          launchAddress: launch.address,
          name: launch.name,
          canGraduate: false,
          marketCapMet: false,
          holdersMet: false,
          concentrationMet: false,
          marketCapUsd: 0,
          holders: 0,
          concentrationBps: 0,
          blockingReasons: ["Error checking launch"],
          triggered: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        errors++;
      }
    }
    
    const readyToGraduate = results.filter(r => r.canGraduate).length;
    
    const report: GraduationReport = {
      checked: activeLaunches.length,
      readyToGraduate,
      triggered,
      errors,
      results,
      timestamp: new Date().toISOString(),
    };
    
    return NextResponse.json(report);
  } catch (error) {
    console.error("Error in graduate check cron:", error);
    return NextResponse.json(
      { error: "Failed to run graduation check" },
      { status: 500 }
    );
  }
}

/**
 * Trigger graduation transaction for a launch
 * 
 * In production, this would:
 * 1. Call your Solana program's graduate instruction
 * 2. Use a secure keypair for the graduation authority
 * 3. Handle transaction signing and submission
 */
async function triggerGraduation(launchAddress: string): Promise<boolean> {
  // TODO: Implement actual graduation triggering
  // This is a placeholder that should be replaced with actual Solana transaction
  
  const graduateApiUrl = process.env.GRADUATE_API_URL;
  const graduateApiKey = process.env.GRADUATE_API_KEY;
  
  if (!graduateApiUrl) {
    console.log(`[MOCK] Would trigger graduation for ${launchAddress}`);
    // Update the launch as graduated in DB for testing
    await db
      .update(launches)
      .set({
        graduated: true,
        graduatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(launches.address, launchAddress));
    return true;
  }
  
  // Call external graduation service
  const response = await fetch(graduateApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${graduateApiKey}`,
    },
    body: JSON.stringify({
      launchAddress,
      timestamp: Date.now(),
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Graduation API error: ${response.status}`);
  }
  
  return true;
}

// Also support POST for flexibility
export const POST = GET;
