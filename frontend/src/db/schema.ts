/**
 * Drizzle ORM Schema for Astra Protocol V7 (Solana)
 *
 * V7 CHANGES:
 * - Removed locked/unlocked split (92/8 removed)
 * - Simplified to total_shares and total_sol
 * - Position only tracks shares and sol_basis
 * - locked_shares only used for creator vesting
 *
 * Uses `astra_sol` schema namespace to avoid conflicts.
 */

import { sql } from "drizzle-orm";
import {
  pgSchema,
  varchar,
  text,
  bigint,
  boolean,
  timestamp,
  index,
  primaryKey,
  integer,
} from "drizzle-orm/pg-core";

// Schema namespace
export const astraSol = pgSchema("astra_sol");

// Enums
export const refundStatusEnum = astraSol.enum("refund_status", [
  "none",
  "pending",
  "processing",
  "completed",
]);

// ============ LAUNCHES ============
// V7: Simplified supply tracking
export const launches = astraSol.table(
  "launches",
  {
    // Identity
    address: varchar("address", { length: 44 }).primaryKey(),
    launchId: bigint("launch_id", { mode: "bigint" }).notNull(),
    creator: varchar("creator", { length: 44 }).notNull(),

    // Metadata
    name: varchar("name", { length: 50 }).notNull(),
    symbol: varchar("symbol", { length: 10 }).notNull(),
    uri: text("uri").notNull(),
    image: text("image"),

    // V7 SUPPLY TRACKING - Simplified (no locked/unlocked split)
    totalShares: bigint("total_shares", { mode: "bigint" })
      .notNull()
      .default(sql`0`),
    totalSol: bigint("total_sol", { mode: "bigint" })
      .notNull()
      .default(sql`0`),

    // V7: Market cap tracking for graduation progress
    marketCapUsd: bigint("market_cap_usd", { mode: "bigint" })
      .notNull()
      .default(sql`0`),

    // Creator seed (for vesting)
    creatorSeedShares: bigint("creator_seed_shares", { mode: "bigint" })
      .notNull()
      .default(sql`0`),
    creatorSeedBasis: bigint("creator_seed_basis", { mode: "bigint" })
      .notNull()
      .default(sql`0`),

    // State
    graduated: boolean("graduated").notNull().default(false),
    refundMode: boolean("refund_mode").notNull().default(false),

    // Janitor State
    refundStatus: refundStatusEnum("refund_status").notNull().default("none"),
    refundCursor: integer("refund_cursor").default(0),
    closedAt: timestamp("closed_at", { withTimezone: true }),

    // V7: Graduation gate tracking (checked off-chain)
    graduationGateHolders: integer("graduation_gate_holders").default(0),
    graduationGateConcentration: integer("graduation_gate_concentration").default(0), // Basis points

    // Graduation data
    tokenMint: varchar("token_mint", { length: 44 }),
    poolAddress: varchar("pool_address", { length: 44 }),
    vault: varchar("vault", { length: 44 }),

    // Vesting
    vestingStart: timestamp("vesting_start", { withTimezone: true }),
    creatorClaimedShares: bigint("creator_claimed_shares", { mode: "bigint" })
      .notNull()
      .default(sql`0`),

    // Fee tracking
    creatorAccruedFees: bigint("creator_accrued_fees", { mode: "bigint" })
      .notNull()
      .default(sql`0`),
    protocolAccruedFees: bigint("protocol_accrued_fees", { mode: "bigint" })
      .notNull()
      .default(sql`0`),

    // Total shares at graduation (for token distribution calculation)
    totalSharesAtGraduation: bigint("total_shares_at_graduation", { mode: "bigint" })
      .notNull()
      .default(sql`0`),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    graduatedAt: timestamp("graduated_at", { withTimezone: true }),
    refundEnabledAt: timestamp("refund_enabled_at", { withTimezone: true }),

    // Indexer metadata
    lastProcessedSlot: bigint("last_processed_slot", { mode: "bigint" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("launches_creator_idx").on(table.creator),
    index("launches_graduated_idx").on(table.graduated),
    index("launches_refund_mode_idx").on(table.refundMode),
    index("launches_refund_status_idx").on(table.refundStatus),
    index("launches_created_at_idx").on(table.createdAt),
    index("launches_market_cap_idx").on(table.marketCapUsd),
  ],
);

// ============ POSITIONS ============
// V7: Simplified (no locked/unlocked split)
export const positions = astraSol.table(
  "positions",
  {
    // Composite key
    launchAddress: varchar("launch_address", { length: 44 }).notNull(),
    userAddress: varchar("user_address", { length: 44 }).notNull(),

    // V7 SHARE TRACKING - Simplified
    // All shares are unlocked (no 92/8 split)
    shares: bigint("shares", { mode: "bigint" })
      .notNull()
      .default(sql`0`),

    // SOL basis for refunds
    solBasis: bigint("sol_basis", { mode: "bigint" })
      .notNull()
      .default(sql`0`),

    // V7: Creator vesting only
    // Only used for creator's seed shares
    lockedShares: bigint("locked_shares", { mode: "bigint" })
      .notNull()
      .default(sql`0`),

    // Claim status
    hasClaimedTokens: boolean("has_claimed_tokens").notNull().default(false),
    hasClaimedRefund: boolean("has_claimed_refund").notNull().default(false),
    vestedSharesClaimed: bigint("vested_shares_claimed", { mode: "bigint" })
      .notNull()
      .default(sql`0`),

    // Janitor Tracking
    refundTx: varchar("refund_tx", { length: 88 }),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),

    // Timestamps
    firstBuyAt: timestamp("first_buy_at", { withTimezone: true }),
    lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }),
  },
  (table) => [
    primaryKey({ columns: [table.launchAddress, table.userAddress] }),
    index("positions_launch_idx").on(table.launchAddress),
    index("positions_user_idx").on(table.userAddress),
    index("positions_refunded_at_idx").on(table.refundedAt),
  ],
);

// ============ TRANSACTIONS ============
export const transactions = astraSol.table(
  "transactions",
  {
    signature: varchar("signature", { length: 88 }).primaryKey(),

    // Context
    launchAddress: varchar("launch_address", { length: 44 }).notNull(),
    userAddress: varchar("user_address", { length: 44 }).notNull(),

    // Transaction type
    type: varchar("type", { length: 20 }).notNull(),

    // Amounts
    solAmount: bigint("sol_amount", { mode: "bigint" }),
    sharesAmount: bigint("shares_amount", { mode: "bigint" }),

    // V7: Market cap at time of transaction
    marketCapUsdAtTx: bigint("market_cap_usd_at_tx", { mode: "bigint" }),

    // Solana metadata
    slot: bigint("slot", { mode: "bigint" }).notNull(),
    blockTime: timestamp("block_time", { withTimezone: true }).notNull(),

    // Indexer metadata
    processedAt: timestamp("processed_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("transactions_launch_idx").on(table.launchAddress),
    index("transactions_user_idx").on(table.userAddress),
    index("transactions_type_idx").on(table.type),
    index("transactions_block_time_idx").on(table.blockTime),
  ],
);

// ============ WEBHOOK EVENTS ============
export const webhookEvents = astraSol.table("webhook_events", {
  signature: varchar("signature", { length: 88 }).primaryKey(),
  processedAt: timestamp("processed_at", { withTimezone: true }).defaultNow(),
});

// ============ USERS ============
export const users = astraSol.table(
  "users",
  {
    address: varchar("address", { length: 44 }).primaryKey(),

    // Profile fields
    username: varchar("username", { length: 32 }).unique(),
    displayName: varchar("display_name", { length: 50 }),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),

    // Social links
    twitter: varchar("twitter", { length: 50 }),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("users_username_idx").on(table.username)],
);

// ============ TYPE EXPORTS ============
export type Launch = typeof launches.$inferSelect;
export type LaunchInsert = typeof launches.$inferInsert;
export type Position = typeof positions.$inferSelect;
export type PositionInsert = typeof positions.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type TransactionInsert = typeof transactions.$inferInsert;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
