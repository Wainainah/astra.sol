#!/usr/bin/env tsx
/**
 * Migrate Tokens - Cron Script
 * 
 * Processes token claims for graduated launches.
 * Users who haven't claimed their SPL tokens are processed in batches.
 * 
 * Run by: .github/workflows/cron-migrate.yml (every 10 minutes)
 */

import { Connection, PublicKey } from '@solana/web3.js';
import * as dotenv from 'dotenv';

dotenv.config();

interface TokenClaim {
  launchAddress: string;
  userAddress: string;
  positionAddress: string;
  shares: number;
}

/**
 * Find unclaimed token positions from database
 */
async function findUnclaimedTokens(dbUrl: string): Promise<TokenClaim[]> {
  // TODO: Implement database query
  // SELECT * FROM positions p
  // JOIN launches l ON p.launch_id = l.id
  // WHERE l.graduated = true
  //   AND p.has_claimed_tokens = false
  // LIMIT 10  // Process in batches
  
  console.log('Querying database for unclaimed tokens...');
  return [];
}

/**
 * Process token claim for a position
 */
async function processTokenClaim(
  connection: Connection,
  programId: PublicKey,
  claim: TokenClaim
): Promise<boolean> {
  try {
    console.log(`Processing token claim for ${claim.userAddress}`);
    console.log(`  Launch: ${claim.launchAddress}`);
    console.log(`  Shares: ${claim.shares}`);
    
    // TODO: Implement Anchor program call for claim_tokens
    // - Call claim_tokens instruction
    // - SPL tokens are minted to user's ATA
    
    return true;
  } catch (error) {
    console.error(`Failed to process claim for ${claim.userAddress}:`, error);
    return false;
  }
}

async function main() {
  console.log('=== Token Migration Cron ===');
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

  // Find unclaimed tokens
  const unclaimedTokens = await findUnclaimedTokens(dbUrl);
  console.log(`Found ${unclaimedTokens.length} unclaimed token positions`);

  // Process claims
  let successCount = 0;
  for (const claim of unclaimedTokens) {
    const success = await processTokenClaim(connection, programId, claim);
    if (success) {
      successCount++;
      // TODO: Update database to mark has_claimed_tokens = true
    }
  }

  console.log(`Processed ${successCount}/${unclaimedTokens.length} token claims`);
  console.log('=== Cron complete ===');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
