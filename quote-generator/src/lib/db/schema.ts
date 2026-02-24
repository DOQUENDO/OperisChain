/**
 * OperisChain — Drizzle ORM Database Schema
 *
 * Tables: clients, documents, rates, quotes, quote_lines, leads
 * All tables designed for the Quote Generator trust threshold:
 * - confidence_score on every extraction
 * - surcharges JSONB with explicit flags
 * - source_doc_id always points to original document
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
  real,
  date,
  jsonb,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───
export const currencyEnum = pgEnum("currency", ["USD", "EUR", "COP"]);
export const freightModeEnum = pgEnum("freight_mode", [
  "air",
  "ocean_fcl",
  "ocean_lcl",
  "ground_ftl",
  "ground_ltl",
  "rail",
  "courier",
  "multimodal",
]);
export const containerTypeEnum = pgEnum("container_type", [
  "20ft",
  "40ft",
  "40hc",
  "45ft",
  "reefer_20",
  "reefer_40",
  "flat_rack",
  "open_top",
  "ftl_truck",
  "ltl_pallet",
  "na",
]);
export const surchargeTypeEnum = pgEnum("surcharge_type", [
  "BAF",
  "FSC",
  "PSS",
  "HANDLING",
  "THC",
  "ISPS",
  "DEMURRAGE",
  "DETENTION",
  "TOLL",
  "FUEL",
  "DOCUMENTATION",
  "CUSTOMS",
  "INSURANCE",
  "OTHER",
]);
export const surchargeStatusEnum = pgEnum("surcharge_status", [
  "included",
  "excluded",
  "unknown",
]);
export const urgencyEnum = pgEnum("urgency", ["high", "normal", "unknown"]);
export const docTypeEnum = pgEnum("doc_type", [
  "email",
  "pdf",
  "excel",
  "word",
  "csv",
  "other",
]);

// ─── Clients ───
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  company: text("company"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Documents ───
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  fileName: text("file_name").notNull(),
  fileType: docTypeEnum("file_type").notNull(),
  filePath: text("file_path"), // Supabase Storage path
  rawText: text("raw_text"), // extracted text content
  metadata: jsonb("metadata"), // flexible metadata
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Rates (The Truth Layer) ───
// This is the core table. Rates are extracted deterministically
// from carrier emails/PDFs and stored as structured data.
// SQL queries this table — NOT vector search.
export const rates = pgTable("rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  sourceDocId: uuid("source_doc_id")
    .references(() => documents.id)
    .notNull(),

  // Carrier & Route — always normalized
  carrier: text("carrier").notNull(), // Normalized: 'Avianca Cargo' not 'AVC'
  origin: text("origin").notNull(), // IATA/UNLOCODE/city: BOG, COBOG, Bogotá
  destination: text("destination").notNull(), // IATA/UNLOCODE/city: MIA, USMIA, Miami

  // Freight mode — what type of transport
  freightMode: freightModeEnum("freight_mode").notNull().default("air"),
  containerType: containerTypeEnum("container_type").default("na"), // For ocean/ground
  unitType: text("unit_type"), // 'per_kg', 'per_container', 'per_pallet', 'flat_rate'

  // Pricing
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull().default("USD"),

  // Transit
  transitDays: integer("transit_days"), // null if unknown

  // Validity
  validUntil: date("valid_until"), // null if 'until further notice'
  validityWarning: text("validity_warning"), // e.g., 'Vigencia indefinida — verificar con carrier'

  // Weight breaks
  weightBreakMin: numeric("weight_break_min", { precision: 10, scale: 2 }),
  weightBreakMax: numeric("weight_break_max", { precision: 10, scale: 2 }),

  // Surcharges — JSONB array of {type, status, note}
  // NEVER silent about surcharges. If unknown, flag it.
  surcharges: jsonb("surcharges").$type<SurchargeFlag[]>().default([]),

  // Confidence — 0.0 to 1.0
  // Below 0.7 = flag for human review
  confidenceScore: real("confidence_score").notNull().default(0),

  // Audit trail
  rawText: text("raw_text"), // Original text for audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Quotes ───
export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),

  // Cargo definition
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  weightKg: numeric("weight_kg", { precision: 10, scale: 2 }).notNull(),
  urgency: urgencyEnum("urgency").notNull().default("unknown"),
  freightMode: freightModeEnum("freight_mode").notNull().default("air"),
  containerType: containerTypeEnum("container_type").default("na"),
  cargoDescription: text("cargo_description"),

  // LLM reasoning output
  recommendedCarrier: text("recommended_carrier"),
  reasoning: text("reasoning"),
  needsClarification: boolean("needs_clarification").default(false),
  clarificationQuestion: text("clarification_question"),

  // Metadata
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Quote Lines ───
export const quoteLines = pgTable("quote_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id")
    .references(() => quotes.id)
    .notNull(),
  rateId: uuid("rate_id")
    .references(() => rates.id)
    .notNull(),

  carrier: text("carrier").notNull(),
  route: text("route").notNull(),
  priceUSD: numeric("price_usd", { precision: 12, scale: 2 }).notNull(),
  transitDays: integer("transit_days"),
  validUntil: date("valid_until"),
  validityWarning: text("validity_warning"),
  surchargeFlags: jsonb("surcharge_flags").$type<SurchargeFlag[]>().default([]),
  confidenceScore: real("confidence_score").notNull(),
  sourceDocId: uuid("source_doc_id")
    .references(() => documents.id)
    .notNull(),
  score: real("score").notNull(), // Calculated by scoring.ts

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Lead Status Enum ───
export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "demo_scheduled",
  "proposal_sent",
  "closed_won",
  "closed_lost",
]);

export const teamSizeEnum = pgEnum("team_size", [
  "1-5",
  "5-20",
  "20-50",
  "50+",
]);

// ─── Leads (Demo Requests / Sales Pipeline) ───
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Contact info (from form)
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull(),
  teamSize: teamSizeEnum("team_size").notNull(),
  phone: text("phone"),
  message: text("message"),

  // Conversion tracking
  planInterest: text("plan_interest"), // 'Starter' | 'Professional' | 'Enterprise'
  source: text("source").default("landing_page"), // landing_page, referral, linkedin, etc.
  language: text("language").default("en"), // en | es — which language they used
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),

  // Pipeline
  status: leadStatusEnum("status").notNull().default("new"),
  notes: text("notes"), // Internal sales notes
  notifiedAt: timestamp("notified_at"), // When email notification sent
  autoRepliedAt: timestamp("auto_replied_at"), // When auto-reply sent

  // Metadata
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Relations ───
export const clientsRelations = relations(clients, ({ many }) => ({
  documents: many(documents),
  rates: many(rates),
  quotes: many(quotes),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  client: one(clients, {
    fields: [documents.clientId],
    references: [clients.id],
  }),
  rates: many(rates),
}));

export const ratesRelations = relations(rates, ({ one }) => ({
  client: one(clients, { fields: [rates.clientId], references: [clients.id] }),
  sourceDoc: one(documents, {
    fields: [rates.sourceDocId],
    references: [documents.id],
  }),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  client: one(clients, { fields: [quotes.clientId], references: [clients.id] }),
  lines: many(quoteLines),
}));

export const quoteLinesRelations = relations(quoteLines, ({ one }) => ({
  quote: one(quotes, { fields: [quoteLines.quoteId], references: [quotes.id] }),
  rate: one(rates, { fields: [quoteLines.rateId], references: [rates.id] }),
  sourceDoc: one(documents, {
    fields: [quoteLines.sourceDocId],
    references: [documents.id],
  }),
}));

// ─── TypeScript Types ───
export type FreightMode =
  | "air"
  | "ocean_fcl"
  | "ocean_lcl"
  | "ground_ftl"
  | "ground_ltl"
  | "rail"
  | "courier"
  | "multimodal";
export type ContainerType =
  | "20ft"
  | "40ft"
  | "40hc"
  | "45ft"
  | "reefer_20"
  | "reefer_40"
  | "flat_rack"
  | "open_top"
  | "ftl_truck"
  | "ltl_pallet"
  | "na";
export type SurchargeType =
  | "BAF"
  | "FSC"
  | "PSS"
  | "HANDLING"
  | "THC"
  | "ISPS"
  | "DEMURRAGE"
  | "DETENTION"
  | "TOLL"
  | "FUEL"
  | "DOCUMENTATION"
  | "CUSTOMS"
  | "INSURANCE"
  | "OTHER";

export type SurchargeFlag = {
  type: SurchargeType;
  status: "included" | "excluded" | "unknown";
  note: string;
};

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Rate = typeof rates.$inferSelect;
export type NewRate = typeof rates.$inferInsert;
export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
export type QuoteLine = typeof quoteLines.$inferSelect;
export type NewQuoteLine = typeof quoteLines.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
