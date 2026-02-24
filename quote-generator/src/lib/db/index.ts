/**
 * OperisChain — Database Connection & Drizzle Instance
 *
 * Uses postgres.js driver with Drizzle ORM.
 * Connection to Supabase PostgreSQL.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Connection for queries (pooled)
const queryClient = postgres(process.env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });

// Export for migration scripts
export const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
