/**
 * Database connection for Astra Protocol V7
 * 
 * Uses Drizzle ORM with PostgreSQL
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Export Drizzle ORM instance
export const db = drizzle(pool, { schema: require("./schema") });

// Re-export schema types
export * from "./schema";
