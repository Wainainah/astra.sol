#!/usr/bin/env tsx
/**
 * Sweep Protocol Fees - Cron Script
 * 
 * Collects accrued protocol fees from graduated launches and
 * transfers them to the protocol treasury.
 * 
 * Run by: .github/workflows/cron-sweep.yml (hourly)
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import * as dotenv from 'dotenv';

dotenv.config();

interface FeeCollection {
  launchAddress: string;
  protocolFees: number;
}

/**
 * Find launches with pending protocol fees
 */
async function findPendingFees(dbUrl: string): Promise<FeeCollection[]> {
  // TODO: Implement database query
  // SELECT address, protocol_accrued_fees 
  // FROM launches
  // WHERE protocol_accrued_fees > 0
  
  console.log('Querying database for pending fees...');
  return [];
}

/**
 * Sweep fees from a launch
 */
async function sweepLaunchFees(
  connection: Connection,
  programId: PublicKey,
  protocolFeeKey: Keypair,
  collection: FeeCollection
): Promise<boolean> {
  try {
    console.log(`Sweeping fees from ${collection.launchAddress}`);
    console.log(`  Amount: ${collection.protocolFees / 1e9} SOL`);
    
    // TODO: Implement fee collection
    // This could be done via:
    // 1. A dedicated sweep_fees instruction, OR
    // 2. Part of the graduate/claim flow
    
    // For now, protocol fees are collected during:
    // - buy: protocol fees go directly to protocol_fee_wallet
    // - graduate: remaining fees could be swept
    
    return true;
  } catch (error) {
    console.error(`Failed to sweep fees from ${collection.launchAddress}:`, error);
    return false;
  }
}

async function main() {
  console.log('=== Fee Sweep Cron ===');
  console.log(`Started at: ${new Date().toISOString()}`);

  const rpcUrl = process.env.RPC_URL;
  const programIdStr = process.env.PROGRAM_ID;
  const dbUrl = process.env.DATABASE_URL;
  const protocolFeeKeyStr = process.env.PROTOCOL_FEE_KEY;

  if (!rpcUrl || !programIdStr || !dbUrl || !protocolFeeKeyStr) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const connection = new Connection(rpcUrl, 'confirmed');
  const programId = new PublicKey(programIdStr);
  const protocolFeeKey = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(protocolFeeKeyStr))
  );

  // Find pending fees
  const pendingFees = await findPendingFees(dbUrl);
  console.log(`Found ${pendingFees.length} launches with pending fees`);

  // Sweep fees
  let totalCollected = 0;
  let successCount = 0;
  for (const collection of pendingFees) {
    const success = await sweepLaunchFees(
      connection,
      programId,
      protocolFeeKey,
      collection
    );
    if (success) {
      successCount++;
      totalCollected += collection.protocolFees;
      // TODO: Update database to mark fees as collected
    }
  }

  console.log(`Collected fees from ${successCount}/${pendingFees.length} launches`);
  console.log(`Total collected: ${totalCollected / 1e9} SOL`);
  console.log('=== Cron complete ===');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
