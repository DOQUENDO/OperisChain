/**
 * OperisChain — Rate Extractor Pipeline
 *
 * Main extraction pipeline: text → GPT-4o → Zod validation → normalize → DB insert
 *
 * This is Stage 1 of the Quote Generator architecture:
 * DETERMINISTIC EXTRACTION — not RAG.
 *
 * When an email/PDF/Excel arrives with rates, we:
 * 1. Parse the text content
 * 2. Use GPT-4o with a narrow, structured prompt to extract rate fields
 * 3. Validate output with Zod (ExtractedRateSchema)
 * 4. Assign confidence_score based on extraction quality
 * 5. Normalize: carrier to titlecase, origin/dest to IATA, currency to USD
 * 6. Insert into rates table via Drizzle ORM
 * 7. Return { success, rates, warnings }
 */

import { parsePDF } from "./pdf";
import { parseExcel } from "./excel";
import { parseEmail, parseEmailText } from "./email";
import {
  normalizeIATA,
  normalizeLocation,
  normalizeValidity,
  normalizeCurrency,
  normalizeCarrier,
} from "./normalizer";
import { getDefaultSurchargeFlags } from "../surcharges";
import type { ExtractedRate } from "../schemas";
import type { NewRate, SurchargeFlag, FreightMode } from "../db/schema";

export type DocumentType = "pdf" | "excel" | "csv" | "email" | "text";

export interface ExtractionInput {
  content: Buffer | string;
  type: DocumentType;
  fileName: string;
  clientId: string;
  documentId: string;
}

export interface ExtractionOutput {
  success: boolean;
  rates: ProcessedRate[];
  warnings: string[];
  documentSummary: string;
}

export interface ProcessedRate {
  raw: ExtractedRate;
  normalized: NewRate;
  warnings: string[];
}

/**
 * Extract text content from a document based on its type.
 */
export async function extractText(
  content: Buffer | string,
  type: DocumentType,
): Promise<string> {
  switch (type) {
    case "pdf": {
      if (typeof content === "string") throw new Error("PDF requires a Buffer");
      const parsed = await parsePDF(content);
      return parsed.text;
    }
    case "excel":
    case "csv": {
      if (typeof content === "string")
        throw new Error("Excel/CSV requires a Buffer");
      const parsed = parseExcel(content);
      return parsed.text;
    }
    case "email": {
      if (typeof content === "string") {
        const parsed = parseEmailText(content);
        return `Subject: ${parsed.subject}\nFrom: ${parsed.from}\n\n${parsed.textBody}`;
      }
      const parsed = await parseEmail(content);
      return `Subject: ${parsed.subject}\nFrom: ${parsed.from}\nDate: ${parsed.date?.toISOString() || "unknown"}\n\n${parsed.textBody}`;
    }
    case "text":
      return typeof content === "string" ? content : content.toString("utf-8");
    default:
      throw new Error(`Unsupported document type: ${type}`);
  }
}

/**
 * Normalize an extracted rate to database-ready format.
 *
 * Applies all normalizers: location codes, carrier names, currencies, dates.
 * Mode-aware: uses IATA for air, UNLOCODE for ocean/ground.
 * Collects warnings for anything that couldn't be resolved cleanly.
 */
export function normalizeExtractedRate(
  raw: ExtractedRate,
  clientId: string,
  documentId: string,
  modeHint?: string,
): ProcessedRate {
  const warnings: string[] = [];
  const mode: FreightMode =
    (raw as { mode?: FreightMode }).mode || (modeHint as FreightMode) || "air";

  // Normalize carrier
  const carrier = normalizeCarrier(raw.carrier);
  if (carrier.warning) warnings.push(carrier.warning);

  // Mode-aware location normalization
  let originCode: string | null;
  let destCode: string | null;

  if (mode === "air") {
    const origin = normalizeIATA(raw.origin);
    if (origin.warning) warnings.push(`Origin: ${origin.warning}`);
    originCode = origin.code;

    const dest = normalizeIATA(raw.destination);
    if (dest.warning) warnings.push(`Destination: ${dest.warning}`);
    destCode = dest.code;
  } else {
    const origin = normalizeLocation(raw.origin, mode);
    if (origin.warning) warnings.push(`Origin: ${origin.warning}`);
    originCode = origin.code;

    const dest = normalizeLocation(raw.destination, mode);
    if (dest.warning) warnings.push(`Destination: ${dest.warning}`);
    destCode = dest.code;
  }

  // Normalize currency to USD
  const price = normalizeCurrency(raw.price, raw.currency);
  if (price.warning) warnings.push(price.warning);

  // Normalize validity date
  const validity = normalizeValidity(raw.validUntil);
  if (validity.warning) warnings.push(validity.warning);

  // Surcharges: use extracted or mode-aware defaults
  const surcharges: SurchargeFlag[] =
    raw.surcharges.length > 0 ? raw.surcharges : getDefaultSurchargeFlags(mode);

  // Validate confidence
  if (raw.confidenceScore < 0.7) {
    warnings.push(
      `Low confidence extraction (${raw.confidenceScore}) — flag for human review`,
    );
  }

  // Validate critical fields
  if (!originCode) {
    warnings.push("Could not determine origin code — manual review required");
  }
  if (!destCode) {
    warnings.push(
      "Could not determine destination code — manual review required",
    );
  }

  const normalized: NewRate = {
    clientId,
    sourceDocId: documentId,
    carrier: carrier.name,
    origin: originCode || "UNK",
    destination: destCode || "UNK",
    freightMode: mode,
    containerType:
      ((raw as { containerType?: string })
        .containerType as NewRate["containerType"]) || "na",
    unitType: (raw as { unitType?: string }).unitType || "per_kg",
    price: String(price.amountUSD),
    currency: "USD",
    transitDays: raw.transitDays,
    validUntil: validity.formatted,
    validityWarning: validity.warning,
    weightBreakMin:
      raw.weightBreakMin !== null ? String(raw.weightBreakMin) : null,
    weightBreakMax:
      raw.weightBreakMax !== null ? String(raw.weightBreakMax) : null,
    surcharges,
    confidenceScore: raw.confidenceScore,
    rawText: raw.rawText,
  };

  return { raw, normalized, warnings };
}

/**
 * Build the LLM extraction prompt.
 *
 * Narrow, structured prompt designed to extract rate data reliably.
 * Mode-aware: adjusts instructions for air, ocean, ground, etc.
 */
export function buildExtractionPrompt(
  text: string,
  modeHint?: FreightMode,
): string {
  // Mode-specific instructions
  const modeInstructions = getModeExtractionInstructions(modeHint);

  return `You are a freight rate extraction specialist. Your job is to extract structured rate data from carrier emails, PDFs, and spreadsheets used in international freight forwarding.

FREIGHT MODE DETECTION:
${modeInstructions}

IMPORTANT RULES:
- Extract ALL rates found in the document, even if there are many
- Each rate should have: carrier, origin, destination, price, currency, transit days, validity, mode, containerType, unitType
- For origin/destination: use IATA airport codes for air, UNLOCODE port codes for ocean, city names for ground
- For prices: extract the EXACT number. Never round or estimate.
- For currency: identify USD, EUR, or COP. If unclear, default to "USD"
- For transit days: extract if available, set to null if not mentioned
- For validity dates: extract as-is (we normalize later). If "until further notice" or similar, keep that text. Use null if not found.
- For weight brackets: extract min/max kg if rate varies by weight. Use null if not specified.
- For surcharges: identify BAF, FSC, PSS, HANDLING, THC, ISPS, DEMURRAGE, DETENTION, TOLL, FUEL, DOCUMENTATION, CUSTOMS, INSURANCE. Mark status as "included", "excluded", or "unknown". Return as an ARRAY of objects.
- confidenceScore: rate 0.0-1.0 how confident you are in the extraction accuracy
- rawText: include the EXACT original text snippet this rate was extracted from

You MUST return a JSON object with EXACTLY this structure (no extra keys, no missing keys):

{
  "rates": [
    {
      "carrier": "Carrier Name",
      "origin": "BOG",
      "destination": "MIA",
      "price": 2.85,
      "currency": "USD",
      "mode": "air",
      "containerType": "na",
      "unitType": "per_kg",
      "transitDays": 2,
      "validUntil": "31/03/2026",
      "weightBreakMin": 45,
      "weightBreakMax": 100,
      "surcharges": [
        { "type": "FSC", "status": "excluded", "note": "USD 0.35/kg" },
        { "type": "BAF", "status": "included", "note": "" }
      ],
      "confidenceScore": 0.95,
      "rawText": "45 - 100 kg | 2.85 USD/kg | 2 días"
    }
  ],
  "documentSummary": "Brief summary of the document",
  "warnings": ["Any issues found"]
}

Field rules:
- "mode": one of "air", "ocean_fcl", "ocean_lcl", "ground_ftl", "ground_ltl", "rail", "courier", "multimodal"
- "containerType": one of "20ft", "40ft", "40hc", "45ft", "reefer_20", "reefer_40", "flat_rack", "open_top", "ftl_truck", "ltl_pallet", "na"
- "unitType": one of "per_kg", "per_container", "per_pallet", "flat_rate"
- "transitDays": integer or null
- "validUntil": string or null  
- "weightBreakMin": number or null
- "weightBreakMax": number or null
- "surcharges": MUST be an array (even if empty: [])
- "confidenceScore": number between 0 and 1
- "rawText": string (never omit)
- "surcharges[].type": one of "BAF", "FSC", "PSS", "HANDLING", "THC", "ISPS", "DEMURRAGE", "DETENTION", "TOLL", "FUEL", "DOCUMENTATION", "CUSTOMS", "INSURANCE", "OTHER"
- "surcharges[].status": one of "included", "excluded", "unknown"
- "surcharges[].note": string (can be empty "")

DOCUMENT CONTENT:
---
${text}
---

Return ONLY valid JSON. No markdown, no code blocks, no explanation.`;
}

/**
 * Get mode-specific extraction instructions.
 */
function getModeExtractionInstructions(mode?: FreightMode): string {
  if (!mode || mode === "air") {
    return `Detect the freight mode from the document. If it mentions airlines, airports, IATA codes, per-kg pricing → mode = "air".
If it mentions shipping lines, ports, containers, TEU, FCL, LCL, UNLOCODE → mode = "ocean_fcl" or "ocean_lcl".
If it mentions trucking, ground transport, FTL, LTL, pallets, tolls → mode = "ground_ftl" or "ground_ltl".
If it mentions rail, ferrocarril → mode = "rail".
If it mentions courier, express, door-to-door → mode = "courier".
When in doubt, default to "air".

FOR AIR: Use IATA codes for locations. unitType = "per_kg". containerType = "na".
FOR OCEAN FCL: Use port names/UNLOCODE. unitType = "per_container". containerType = appropriate size (20ft, 40ft, etc.).
FOR OCEAN LCL: Use port names/UNLOCODE. unitType = "per_kg" or "per_pallet". containerType = "na".
FOR GROUND FTL: Use city names. unitType = "flat_rate" or "per_kg". containerType = "ftl_truck".
FOR GROUND LTL: Use city names. unitType = "per_kg" or "per_pallet". containerType = "ltl_pallet".`;
  }

  switch (mode) {
    case "ocean_fcl":
      return `This is an OCEAN FCL (Full Container Load) document. Extract container rates.
Use port names or UNLOCODE codes for locations. Set unitType = "per_container".
Identify container type: 20ft, 40ft, 40hc, 45ft, reefer_20, reefer_40, flat_rack, open_top.
Look for THC, ISPS, DEMURRAGE, DETENTION surcharges specifically.`;
    case "ocean_lcl":
      return `This is an OCEAN LCL (Less than Container Load) document. Extract CBM/weight rates.
Use port names or UNLOCODE codes for locations. Set unitType = "per_kg" or "per_pallet". containerType = "na".
Look for THC, ISPS surcharges specifically.`;
    case "ground_ftl":
      return `This is a GROUND FTL (Full Truck Load) document. Extract trucking rates.
Use city names for locations. Set containerType = "ftl_truck". unitType = "flat_rate".
Look for TOLL, FUEL, INSURANCE surcharges specifically.`;
    case "ground_ltl":
      return `This is a GROUND LTL (Less than Truck Load) document. Extract pallet/parcel rates.
Use city names for locations. Set containerType = "ltl_pallet". unitType = "per_kg" or "per_pallet".
Look for TOLL, FUEL surcharges specifically.`;
    case "rail":
      return `This is a RAIL freight document. Extract rail rates.
Use city names or UNLOCODE codes. unitType = "per_container" or "per_kg".
Look for HANDLING, FUEL surcharges.`;
    case "courier":
      return `This is a COURIER/EXPRESS document. Extract courier rates.
Use IATA codes or city names. unitType = "per_kg" or "flat_rate". containerType = "na".
Look for FUEL, HANDLING, CUSTOMS, INSURANCE surcharges.`;
    case "multimodal":
      return `This is a MULTIMODAL document combining multiple transport types.
Identify each leg's mode separately. Use appropriate location codes per leg.
Look for all surcharge types.`;
    default:
      return `Auto-detect the freight mode from the document content.`;
  }
}

/**
 * Detect document type from file extension.
 */
export function detectDocumentType(fileName: string): DocumentType {
  const ext = fileName.toLowerCase().split(".").pop();
  switch (ext) {
    case "pdf":
      return "pdf";
    case "xlsx":
    case "xls":
      return "excel";
    case "csv":
      return "csv";
    case "eml":
    case "msg":
      return "email";
    default:
      return "text";
  }
}
