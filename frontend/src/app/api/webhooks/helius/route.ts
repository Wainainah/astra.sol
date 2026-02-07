/**
 * POST /api/webhooks/helius
 * 
 * Helius webhook handler for blockchain events.
 * 
 * Processes:
 * - MarketCapUpdated events: Update market cap in DB
 * - ReadyToGraduate events: Mark launch as ready
 * - Buy/Sell transactions: Update positions
 * - Graduation events: Update launch status
 * 
 * V7 Schema: Simplified positions (no locked/unlocked split)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { launches, positions, transactions, webhookEvents } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

interface HeliusWebhookPayload {
  signature: string;
  type: string;
  timestamp: number;
  slot: number;
  nativeTransfers?: NativeTransfer[];
  tokenTransfers?: TokenTransfer[];
  accountData?: AccountData[];
  events?: HeliusEvent[];
  description?: string;
}

interface NativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number;
}

interface TokenTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  tokenAmount: number;
  mint: string;
}

interface AccountData {
  account: string;
  nativeBalanceChange?: number;
  tokenBalanceChanges?: TokenBalanceChange[];
}

interface TokenBalanceChange {
  mint: string;
  rawTokenAmount: {
    tokenAmount: string;
    decimals: number;
  };
}

interface HeliusEvent {
  type: string;
  data: Record<string, unknown>;
}

interface MarketCapUpdatedEvent {
  launchAddress: string;
  totalSol: string;
  marketCapUsd: string;
  timestamp: number;
}

interface ReadyToGraduateEvent {
  launchAddress: string;
  timestamp: number;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify webhook signature if configured
    const webhookSecret = process.env.HELIUS_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get("x-helius-signature");
      // TODO: Implement signature verification
      // const isValid = verifyHeliusSignature(await request.text(), signature, webhookSecret);
      // if (!isValid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    
    const payload: HeliusWebhookPayload[] = await request.json();
    
    // Process each webhook event
    const results = await Promise.all(
      payload.map(async (event) => {
        try {
          return await processWebhookEvent(event);
        } catch (error) {
          console.error("Error processing webhook event:", error);
          return {
            signature: event.signature,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );
    
    return NextResponse.json({
      processed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error processing Helius webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

// ============================================================================
// EVENT PROCESSING
// ============================================================================

async function processWebhookEvent(event: HeliusWebhookPayload) {
  const signature = event.signature;
  
  // Check if already processed (idempotency)
  const existing = await db
    .select({ signature: webhookEvents.signature })
    .from(webhookEvents)
    .where(eq(webhookEvents.signature, signature))
    .limit(1);
  
  if (existing.length > 0) {
    return { signature, success: true, status: "already_processed" };
  }
  
  // Mark as processed
  await db.insert(webhookEvents).values({
    signature,
    processedAt: new Date(),
  });
  
  // Process based on event type
  const eventType = event.type?.toLowerCase();
  
  switch (eventType) {
    case "marketcapupdated":
    case "market_cap_updated":
      await handleMarketCapUpdated(event);
      break;
      
    case "readytograduate":
    case "ready_to_graduate":
      await handleReadyToGraduate(event);
      break;
      
    case "buy":
      await handleBuy(event);
      break;
      
    case "sell":
      await handleSell(event);
      break;
      
    case "graduate":
    case "graduated":
      await handleGraduate(event);
      break;
      
    case "create":
    case "created":
      await handleCreate(event);
      break;
      
    default:
      // Unknown event type - log but don't fail
      console.log(`Unknown event type: ${eventType}`);
  }
  
  return { signature, success: true, type: eventType };
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

async function handleMarketCapUpdated(event: HeliusWebhookPayload) {
  // Extract data from event
  const eventData = event.events?.find(e => e.type === "marketCapUpdated")?.data as MarketCapUpdatedEvent | undefined;
  
  if (!eventData?.launchAddress) {
    console.log("No launch address in MarketCapUpdated event");
    return;
  }
  
  const launchAddress = eventData.launchAddress;
  const totalSol = BigInt(eventData.totalSol);
  const marketCapUsd = BigInt(eventData.marketCapUsd);
  
  // Update launch
  await db
    .update(launches)
    .set({
      totalSol,
      marketCapUsd,
      updatedAt: new Date(),
    })
    .where(eq(launches.address, launchAddress));
  
  console.log(`Updated market cap for ${launchAddress}: ${marketCapUsd} USD`);
}

async function handleReadyToGraduate(event: HeliusWebhookPayload) {
  const eventData = event.events?.find(e => e.type === "readyToGraduate")?.data as ReadyToGraduateEvent | undefined;
  
  if (!eventData?.launchAddress) {
    console.log("No launch address in ReadyToGraduate event");
    return;
  }
  
  // Update graduation gate fields
  await db
    .update(launches)
    .set({
      updatedAt: new Date(),
    })
    .where(eq(launches.address, eventData.launchAddress));
  
  console.log(`Launch ${eventData.launchAddress} is ready to graduate`);
}

async function handleBuy(event: HeliusWebhookPayload) {
  // Extract data from accounts and transfers
  const { launchAddress, userAddress, solAmount, sharesAmount } = extractTransactionData(event);
  
  if (!launchAddress || !userAddress) {
    console.log("Missing data in Buy event");
    return;
  }
  
  // Insert transaction record
  await db.insert(transactions).values({
    signature: event.signature,
    launchAddress,
    userAddress,
    type: "buy",
    solAmount: solAmount ? BigInt(solAmount) : null,
    sharesAmount: sharesAmount ? BigInt(sharesAmount) : null,
    slot: BigInt(event.slot),
    blockTime: new Date(event.timestamp * 1000),
  }).onConflictDoNothing();
  
  // Update or create position (V7: Simplified - no locked/unlocked split)
  const existingPosition = await db
    .select()
    .from(positions)
    .where(
      and(
        eq(positions.launchAddress, launchAddress),
        eq(positions.userAddress, userAddress)
      )
    )
    .limit(1);
  
  if (existingPosition.length > 0) {
    // Update existing position
    const pos = existingPosition[0];
    await db
      .update(positions)
      .set({
        shares: pos.shares + BigInt(sharesAmount ?? 0),
        solBasis: pos.solBasis + BigInt(solAmount ?? 0),
        lastUpdatedAt: new Date(),
      })
      .where(
        and(
          eq(positions.launchAddress, launchAddress),
          eq(positions.userAddress, userAddress)
        )
      );
  } else {
    // Create new position
    await db.insert(positions).values({
      launchAddress,
      userAddress,
      shares: BigInt(sharesAmount ?? 0),
      solBasis: BigInt(solAmount ?? 0),
      lockedShares: BigInt(0),
      firstBuyAt: new Date(),
      lastUpdatedAt: new Date(),
    });
  }
  
  console.log(`Processed buy: ${userAddress} bought ${sharesAmount} shares in ${launchAddress}`);
}

async function handleSell(event: HeliusWebhookPayload) {
  const { launchAddress, userAddress, solAmount, sharesAmount } = extractTransactionData(event);
  
  if (!launchAddress || !userAddress) {
    console.log("Missing data in Sell event");
    return;
  }
  
  // Insert transaction record
  await db.insert(transactions).values({
    signature: event.signature,
    launchAddress,
    userAddress,
    type: "sell",
    solAmount: solAmount ? BigInt(solAmount) : null,
    sharesAmount: sharesAmount ? BigInt(sharesAmount) : null,
    slot: BigInt(event.slot),
    blockTime: new Date(event.timestamp * 1000),
  }).onConflictDoNothing();
  
  // Update position (reduce shares and basis proportionally)
  const existingPosition = await db
    .select()
    .from(positions)
    .where(
      and(
        eq(positions.launchAddress, launchAddress),
        eq(positions.userAddress, userAddress)
      )
    )
    .limit(1);
  
  if (existingPosition.length > 0) {
    const pos = existingPosition[0];
    const sharesToSell = BigInt(sharesAmount ?? 0);
    const currentShares = pos.shares;
    
    // Calculate proportional basis reduction
    // basisReduction = sharesToSell * totalBasis / totalShares
    const basisReduction = currentShares > 0
      ? (sharesToSell * pos.solBasis) / currentShares
      : BigInt(0);
    
    const newShares = currentShares - sharesToSell;
    const newBasis = pos.solBasis - basisReduction;
    
    if (newShares <= 0) {
      // Position fully closed - delete or mark as empty
      await db
        .update(positions)
        .set({
          shares: BigInt(0),
          solBasis: BigInt(0),
          lastUpdatedAt: new Date(),
        })
        .where(
          and(
            eq(positions.launchAddress, launchAddress),
            eq(positions.userAddress, userAddress)
          )
        );
    } else {
      await db
        .update(positions)
        .set({
          shares: newShares,
          solBasis: newBasis,
          lastUpdatedAt: new Date(),
        })
        .where(
          and(
            eq(positions.launchAddress, launchAddress),
            eq(positions.userAddress, userAddress)
          )
        );
    }
  }
  
  console.log(`Processed sell: ${userAddress} sold ${sharesAmount} shares in ${launchAddress}`);
}

async function handleGraduate(event: HeliusWebhookPayload) {
  const { launchAddress, tokenMint, poolAddress } = extractGraduationData(event);
  
  if (!launchAddress) {
    console.log("Missing launch address in Graduate event");
    return;
  }
  
  // Get current total shares for distribution calculation
  const launch = await db
    .select({ totalShares: launches.totalShares })
    .from(launches)
    .where(eq(launches.address, launchAddress))
    .limit(1);
  
  if (launch.length > 0) {
    // Update launch as graduated
    await db
      .update(launches)
      .set({
        graduated: true,
        graduatedAt: new Date(),
        tokenMint: tokenMint ?? null,
        poolAddress: poolAddress ?? null,
        totalSharesAtGraduation: launch[0].totalShares,
        updatedAt: new Date(),
      })
      .where(eq(launches.address, launchAddress));
    
    console.log(`Launch ${launchAddress} graduated! Token mint: ${tokenMint}`);
  }
}

async function handleCreate(event: HeliusWebhookPayload) {
  const { launchAddress, creator, name, symbol, uri } = extractCreateData(event);
  
  if (!launchAddress) {
    console.log("Missing launch address in Create event");
    return;
  }
  
  // Insert transaction record for creation
  if (creator) {
    await db.insert(transactions).values({
      signature: event.signature,
      launchAddress,
      userAddress: creator,
      type: "create",
      slot: BigInt(event.slot),
      blockTime: new Date(event.timestamp * 1000),
    }).onConflictDoNothing();
  }
  
  console.log(`Processed create: ${launchAddress} by ${creator}`);
}

// ============================================================================
// DATA EXTRACTION HELPERS
// ============================================================================

function extractTransactionData(event: HeliusWebhookPayload) {
  // This is a simplified extraction - adjust based on your actual program account structure
  const accountData = event.accountData ?? [];
  const nativeTransfers = event.nativeTransfers ?? [];
  
  // Find launch address (usually a PDA)
  const launchAddress = event.events?.find(e => e.data?.launchAddress)?.data?.launchAddress as string | undefined;
  const userAddress = event.events?.find(e => e.data?.userAddress)?.data?.userAddress as string | undefined;
  
  // Extract amounts from event data or calculate from transfers
  const solAmount = event.events?.find(e => e.data?.solAmount)?.data?.solAmount as string | undefined;
  const sharesAmount = event.events?.find(e => e.data?.sharesAmount)?.data?.sharesAmount as string | undefined;
  
  return {
    launchAddress,
    userAddress,
    solAmount,
    sharesAmount,
  };
}

function extractGraduationData(event: HeliusWebhookPayload) {
  const eventData = event.events?.find(e => e.type === "graduate")?.data;
  
  return {
    launchAddress: eventData?.launchAddress as string | undefined,
    tokenMint: eventData?.tokenMint as string | undefined,
    poolAddress: eventData?.poolAddress as string | undefined,
  };
}

function extractCreateData(event: HeliusWebhookPayload) {
  const eventData = event.events?.find(e => e.type === "create")?.data;
  
  return {
    launchAddress: eventData?.launchAddress as string | undefined,
    creator: eventData?.creator as string | undefined,
    name: eventData?.name as string | undefined,
    symbol: eventData?.symbol as string | undefined,
    uri: eventData?.uri as string | undefined,
  };
}
