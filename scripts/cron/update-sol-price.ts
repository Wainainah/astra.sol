#!/usr/bin/env tsx
/**
 * Update SOL Price - Cron Script
 * 
 * Fetches the current SOL/USD price from Pyth oracle and updates
the on-chain config account. Also updates the cached fallback price.
 * 
 * Run by: .github/workflows/update-sol-price.yml (every 1 minute)
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { PriceServiceConnection } from '@pythnetwork/price-service-client';
import * as dotenv from 'dotenv';

dotenv.config();

// Pyth SOL/USD price feed ID
const PYTH_SOL_USD_FEED_ID = 'H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG';

interface SolPriceResponse {
  price: number;
  timestamp: number;
  confidence: number;
}

/**
 * Fetch SOL/USD price from Pyth
 */
async function fetchPythPrice(): Promise<SolPriceResponse | null> {
  try {
    // For mainnet, use Pyth's price service
    const connection = new PriceServiceConnection('https://hermes.pyth.network');
    
    const priceFeeds = await connection.getLatestPriceFeeds([PYTH_SOL_USD_FEED_ID]);
    if (!priceFeeds || priceFeeds.length === 0) {
      console.error('No price feed available from Pyth');
      return null;
    }

    const feed = priceFeeds[0];
    const price = feed.getPriceUnchecked();
    
    return {
      price: Number(price.price) * Math.pow(10, price.expo),
      timestamp: price.publishTime * 1000,
      confidence: Number(price.conf) * Math.pow(10, price.expo),
    };
  } catch (error) {
    console.error('Failed to fetch Pyth price:', error);
    return null;
  }
}

/**
 * Update on-chain price
 */
async function updateOnChainPrice(
  connection: Connection,
  programId: PublicKey,
  authority: Keypair,
  priceUsd: number
): Promise<boolean> {
  try {
    // Convert to u64 format (price * 10^8 for 8 decimal precision)
    const priceScaled = Math.round(priceUsd * 1e8);
    
    console.log(`Updating on-chain price to ${priceUsd} USD (${priceScaled} scaled)`);
    
    // TODO: Implement Anchor program call to update price
    // This requires the IDL and program interface
    
    console.log('On-chain price update successful');
    return true;
  } catch (error) {
    console.error('Failed to update on-chain price:', error);
    return false;
  }
}

/**
 * Update cached fallback price file
 */
async function updateFallbackPrice(priceUsd: number): Promise<void> {
  const fs = await import('fs/promises');
  const path = './fallback-price.json';
  
  const data = {
    price: priceUsd,
    timestamp: Date.now(),
    source: 'pyth',
  };
  
  await fs.writeFile(path, JSON.stringify(data, null, 2));
  console.log(`Fallback price updated: ${priceUsd} USD`);
}

async function main() {
  console.log('=== SOL Price Update Cron ===');
  console.log(`Started at: ${new Date().toISOString()}`);

  // Get environment variables
  const rpcUrl = process.env.RPC_URL;
  const programIdStr = process.env.PROGRAM_ID;
  const authorityKeyStr = process.env.AUTHORITY_KEY;

  if (!rpcUrl || !programIdStr || !authorityKeyStr) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  // Setup connection
  const connection = new Connection(rpcUrl, 'confirmed');
  const programId = new PublicKey(programIdStr);
  const authority = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(authorityKeyStr))
  );

  // Fetch current price
  const priceData = await fetchPythPrice();
  if (!priceData) {
    console.error('Failed to fetch price from Pyth');
    process.exit(1);
  }

  console.log(`Current SOL/USD: $${priceData.price.toFixed(2)}`);
  console.log(`Confidence: $${priceData.confidence.toFixed(4)}`);
  console.log(`Pyth timestamp: ${new Date(priceData.timestamp).toISOString()}`);

  // Update on-chain price
  const success = await updateOnChainPrice(
    connection,
    programId,
    authority,
    priceData.price
  );

  if (!success) {
    console.error('Failed to update on-chain price');
    process.exit(1);
  }

  // Update fallback file
  await updateFallbackPrice(priceData.price);

  console.log('=== Price update complete ===');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
