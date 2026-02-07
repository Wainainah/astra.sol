#!/usr/bin/env tsx
/**
 * Enable Refunds - Cron Script
 * 
 * Checks for expired launches (7+ days old, not graduated) and enables
 * refund mode so users can recover their funds.
 * 
 * Run by: .github/workflows/cron-refund-enable.yml (every 15 minutes)
 */

import { Connection, PublicKey } from '@solana/web3.js';
import * as dotenv from 'dotenv';

dotenv.config();

interface LaunchData {
  address: string;
  createdAt: number;
  graduated: boolean;
  refundMode: boolean;
}

/**
 * Find expired launches from database
 */
async function findExpiredLaunches(dbUrl: string): Promise<LaunchData[]> {
  // TODO: Implement database query
  // SELECT * FROM launches 
  // WHERE graduated = false 
  //   AND refund_mode = false
  //   AND created_at < NOW() - INTERVAL '7 days'
  
  console.log('Querying database for expired launches...');
  return [];
}

/**
 * Enable refund mode for a launch
 */
async function enableRefundMode(
  connection: Connection,
  programId: PublicKey,
  launchAddress: PublicKey
): Promise<boolean> {
  try {
    console.log(`Enabling refund mode for ${launchAddress.toBase58()}`);
    
    // TODO: Implement Anchor program call
    // This is permissionless - anyone can call after 7 days
    
    return true;
  } catch (error) {
    console.error(`Failed to enable refund for ${launchAddress.toBase58()}:`, error);
    return false;
  }
}

async function main() {
  console.log('=== Refund Enable Cron ===');
  console.log(`Started at: ${new Date().toISOString()}`);

  const rpcUrl = process.env.RPC_URL;
  const programIdStr = process.env.PROGRAM_ID;
  const dbUrl = process.env.DATABASE_URL;

  if (!rpcUrl || !programIdStr || !dbUrl) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const connection = new Connection(rpcUrl, 'confirmed');
  const programId = new PublicKey(programIdStr);

  // Find expired launches
  const expiredLaunches = await findExpiredLaunches(dbUrl);
  console.log(`Found ${expiredLaunches.length} expired launches`);

  // Enable refund mode for each
  let successCount = 0;
  for (const launch of expiredLaunches) {
    const launchPubkey = new PublicKey(launch.address);
    const success = await enableRefundMode(connection, programId, launchPubkey);
    if (success) {
      successCount++;
      // TODO: Update database to mark refund_mode = true
    }
  }

  console.log(`Enabled refund mode for ${successCount}/${expiredLaunches.length} launches`);
  console.log('=== Cron complete ===');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
