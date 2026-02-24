/**
 * OperisChain — Zod Schemas
 *
 * The contracts of the system. Define exactly what enters,
 * what exits, and what the LLM can and cannot produce.
 *
 * Every LLM output MUST be validated with these schemas.
 */

import { z } from "zod";

// ─── Surcharge Flag Schema ───
export const SurchargeFlagSchema = z.object({
  type: z.enum([
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
  ]),
  status: z.enum(["included", "excluded", "unknown"]),
  note: z.string(),
});

// ─── Freight Mode Schema ───
export const FreightModeSchema = z.enum([
  "air",
  "ocean_fcl",
  "ocean_lcl",
  "ground_ftl",
  "ground_ltl",
  "rail",
  "courier",
  "multimodal",
]);
export type FreightModeZod = z.infer<typeof FreightModeSchema>;

// ─── Container Type Schema ───
export const ContainerTypeSchema = z.enum([
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

// ─── Extracted Rate Schema (LLM extraction output) ───
// Schema is lenient on optional fields — LLMs often omit nullables.
// We use .optional().default() to handle missing fields gracefully.
export const ExtractedRateSchema = z.object({
  carrier: z.string().describe("Carrier name as found in the source"),
  origin: z
    .string()
    .min(2)
    .max(50)
    .describe("Origin city, IATA code, or UNLOCODE"),
  destination: z
    .string()
    .min(2)
    .max(50)
    .describe("Destination city, IATA code, or UNLOCODE"),
  price: z.number().positive().describe("Rate price as a number"),
  currency: z
    .enum(["USD", "EUR", "COP"])
    .default("USD")
    .describe("Currency code"),
  mode: FreightModeSchema.optional()
    .default("air")
    .describe(
      "Freight mode: air, ocean_fcl, ocean_lcl, ground_ftl, ground_ltl, rail, courier, multimodal",
    ),
  containerType: ContainerTypeSchema.optional()
    .default("na")
    .describe(
      "Container type for ocean/ground: 20ft, 40ft, 40hc, ftl_truck, ltl_pallet, na",
    ),
  unitType: z
    .string()
    .optional()
    .default("per_kg")
    .describe("Pricing unit: per_kg, per_container, per_pallet, flat_rate"),
  transitDays: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .default(null)
    .describe("Transit time in days, null if not specified"),
  validUntil: z
    .string()
    .nullable()
    .optional()
    .default(null)
    .describe("Validity date as raw string, null if not specified"),
  weightBreakMin: z
    .number()
    .nullable()
    .optional()
    .default(null)
    .describe(
      "Minimum weight in kg for this rate bracket, null if not specified",
    ),
  weightBreakMax: z
    .number()
    .nullable()
    .optional()
    .default(null)
    .describe(
      "Maximum weight in kg for this rate bracket, null if not specified",
    ),
  surcharges: z
    .array(SurchargeFlagSchema)
    .optional()
    .default([])
    .describe("Surcharge information with explicit status"),
  confidenceScore: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .default(0.5)
    .describe("Confidence in extraction accuracy, 0.0 to 1.0"),
  rawText: z
    .string()
    .optional()
    .default("")
    .describe("The exact original text this rate was extracted from"),
});

export type ExtractedRate = z.infer<typeof ExtractedRateSchema>;

// ─── Multi-Rate Extraction (batch response) ───
export const ExtractionResultSchema = z.object({
  rates: z
    .array(ExtractedRateSchema)
    .describe("All rates found in the document"),
  documentSummary: z.string().describe("Brief summary of the document content"),
  warnings: z
    .array(z.string())
    .describe("Any issues or ambiguities found during extraction"),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

// ─── Quote Line Schema ───
export const QuoteLineSchema = z.object({
  carrier: z.string(),
  route: z.string(),
  priceUSD: z.number(),
  transitDays: z.number().nullable(),
  validUntil: z.string().nullable(),
  validityWarning: z.string().nullable(),
  surchargeFlags: z.array(SurchargeFlagSchema),
  confidenceScore: z.number(),
  sourceDocId: z.string(),
  score: z.number(),
});

export type QuoteLineType = z.infer<typeof QuoteLineSchema>;

// ─── Quote Schema (Final output to user) ───
export const QuoteSchema = z.object({
  quoteId: z.string(),
  generatedAt: z.string(),
  cargo: z.object({
    origin: z.string(),
    destination: z.string(),
    weightKg: z.number(),
    urgency: z.enum(["high", "normal", "unknown"]),
    mode: FreightModeSchema.default("air"),
  }),
  lines: z.array(QuoteLineSchema),
  recommended: z.string().describe("Carrier name of the recommended option"),
  reasoning: z
    .string()
    .describe("Explanation of the recommendation in Spanish"),
  needsClarification: z.boolean(),
  clarificationQuestion: z.string().nullable(),
});

export type QuoteType = z.infer<typeof QuoteSchema>;

// ─── LLM Reasoning Output Schema ───
// Resilient to LLM output variations (missing fields, snake_case keys)
export const QuoteReasoningSchema = z.object({
  recommended: z.string().describe("Name of the recommended carrier"),
  reasoning: z
    .string()
    .describe(
      "Detailed explanation in Spanish of why this carrier is recommended",
    ),
  needsClarification: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Whether the user needs to provide more information (e.g., urgency level)",
    ),
  clarificationQuestion: z
    .string()
    .nullable()
    .optional()
    .default(null)
    .describe("Specific question to ask the user if clarification is needed"),
  lineNotes: z
    .array(
      z.object({
        carrier: z.string(),
        note: z.string().describe("Specific note about this carrier option"),
      }),
    )
    .optional()
    .default([])
    .describe("Per-carrier notes from the LLM analysis"),
});

export type QuoteReasoning = z.infer<typeof QuoteReasoningSchema>;

// ─── Cargo Definition (user input) ───
export const CargoDefSchema = z.object({
  origin: z.string().min(2),
  destination: z.string().min(2),
  weightKg: z.number().positive(),
  urgency: z.enum(["high", "normal", "unknown"]).default("unknown"),
  mode: FreightModeSchema.default("air"),
  containerType: ContainerTypeSchema.optional().default("na"),
  description: z.string().optional(),
});

export type CargoDef = z.infer<typeof CargoDefSchema>;
