/**
 * OperisChain — DB Queries (SQL Deterministic Layer)
 *
 * These queries are the TRUTH LAYER of the system.
 * No vector search for pricing. No embedding similarity for route matching.
 * Pure SQL filtering on the rates table.
 */

import { db } from "./index";
import {
  rates,
  quotes,
  quoteLines,
  documents,
  ingestionJobs,
  type Rate,
  type FreightMode,
} from "./schema";
import { eq, and, gte, lte, or, isNull, gt, sql, desc } from "drizzle-orm";

export interface RouteQuery {
  origin: string; // IATA or UNLOCODE: BOG, COBUN
  destination: string; // IATA or UNLOCODE: MIA, NLRTM
  weightKg: number;
  clientId: string;
  freightMode?: FreightMode; // Optional filter by mode (air, ocean_fcl, etc.)
}

/**
 * Get rates for a specific route — SQL deterministic filter.
 *
 * Filters by:
 * - Origin & destination (IATA/UNLOCODE codes)
 * - valid_until > NOW() OR valid_until IS NULL (with warning)
 * - Weight bracket contains the requested weight (or no bracket)
 * - Client isolation
 * - Freight mode (optional — filters if provided)
 *
 * Orders by price ASC.
 */
export async function getRatesForRoute(query: RouteQuery): Promise<Rate[]> {
  const { origin, destination, weightKg, clientId, freightMode } = query;

  const conditions = [
    eq(rates.origin, origin.toUpperCase()),
    eq(rates.destination, destination.toUpperCase()),
    eq(rates.clientId, clientId),
    // Valid rates: not expired OR no expiry date
    or(gt(rates.validUntil, sql`CURRENT_DATE`), isNull(rates.validUntil)),
    // Weight bracket matching — 4 cases:
    // 1. Both min & max set: weight falls within [min, max]
    // 2. Only min set (max null): weight >= min (e.g. LTL "minimum 50kg")
    // 3. Only max set (min null): weight <= max
    // 4. Neither set: applies to all weights (e.g. FTL flat rate)
    or(
      and(
        lte(rates.weightBreakMin, String(weightKg)),
        gte(rates.weightBreakMax, String(weightKg)),
      ),
      and(
        lte(rates.weightBreakMin, String(weightKg)),
        isNull(rates.weightBreakMax),
      ),
      and(
        isNull(rates.weightBreakMin),
        gte(rates.weightBreakMax, String(weightKg)),
      ),
      and(isNull(rates.weightBreakMin), isNull(rates.weightBreakMax)),
    ),
  ];

  // Optionally filter by freight mode
  if (freightMode) {
    conditions.push(eq(rates.freightMode, freightMode));
  }

  const result = await db
    .select()
    .from(rates)
    .where(and(...conditions))
    .orderBy(rates.price);

  return result;
}

/**
 * Get all rates for a client, optionally filtered by route.
 */
export async function getRatesByClient(
  clientId: string,
  filters?: { origin?: string; destination?: string },
): Promise<Rate[]> {
  const conditions = [eq(rates.clientId, clientId)];

  if (filters?.origin) {
    conditions.push(eq(rates.origin, filters.origin.toUpperCase()));
  }
  if (filters?.destination) {
    conditions.push(eq(rates.destination, filters.destination.toUpperCase()));
  }

  return db
    .select()
    .from(rates)
    .where(and(...conditions))
    .orderBy(desc(rates.createdAt));
}

/**
 * Insert a new rate into the database.
 * Returns the inserted rate.
 */
export async function insertRate(rate: typeof rates.$inferInsert) {
  const [inserted] = await db.insert(rates).values(rate).returning();
  return inserted;
}

/**
 * Insert multiple rates in a batch.
 */
export async function insertRates(ratesBatch: (typeof rates.$inferInsert)[]) {
  if (ratesBatch.length === 0) return [];
  return db.insert(rates).values(ratesBatch).returning();
}

/**
 * Insert a document record.
 */
export async function insertDocument(doc: typeof documents.$inferInsert) {
  const [inserted] = await db.insert(documents).values(doc).returning();
  return inserted;
}

/**
 * Create a quote with its lines.
 */
export async function createQuote(
  quote: typeof quotes.$inferInsert,
  lines: Omit<typeof quoteLines.$inferInsert, "quoteId">[],
) {
  // Insert quote
  const [insertedQuote] = await db.insert(quotes).values(quote).returning();

  // Insert quote lines with the quote ID
  const linesWithQuoteId = lines.map((line) => ({
    ...line,
    quoteId: insertedQuote.id,
  }));

  const insertedLines =
    linesWithQuoteId.length > 0
      ? await db.insert(quoteLines).values(linesWithQuoteId).returning()
      : [];

  return { quote: insertedQuote, lines: insertedLines };
}

/**
 * Get a quote by ID with all its lines.
 */
export async function getQuoteWithLines(quoteId: string) {
  const quote = await db.query.quotes.findFirst({
    where: eq(quotes.id, quoteId),
    with: {
      lines: true,
    },
  });

  return quote;
}

/**
 * Get all quotes for a client.
 */
export async function getQuotesByClient(clientId: string) {
  return db.query.quotes.findMany({
    where: eq(quotes.clientId, clientId),
    with: {
      lines: true,
    },
    orderBy: desc(quotes.generatedAt),
  });
}

// ─── Ingestion Jobs ───

/**
 * Create a new ingestion job (pending status).
 */
export async function createIngestionJob(
  job: typeof ingestionJobs.$inferInsert,
) {
  const [inserted] = await db.insert(ingestionJobs).values(job).returning();
  return inserted;
}

/**
 * Update an ingestion job's status and optional fields.
 */
export async function updateIngestionJob(
  jobId: string,
  updates: Partial<{
    status: "pending" | "processing" | "done" | "failed";
    documentId: string;
    ratesExtracted: number;
    errorMessage: string;
  }>,
) {
  const [updated] = await db
    .update(ingestionJobs)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(ingestionJobs.id, jobId))
    .returning();
  return updated;
}

/**
 * Get an ingestion job by ID.
 */
export async function getIngestionJob(jobId: string) {
  return db.query.ingestionJobs.findFirst({
    where: eq(ingestionJobs.id, jobId),
  });
}

/**
 * Get recent ingestion jobs for a client (for polling).
 */
export async function getRecentIngestionJobs(clientId: string, limit = 10) {
  return db.query.ingestionJobs.findMany({
    where: eq(ingestionJobs.clientId, clientId),
    orderBy: desc(ingestionJobs.createdAt),
    limit,
  });
}
