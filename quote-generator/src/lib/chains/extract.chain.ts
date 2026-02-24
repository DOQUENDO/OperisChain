/**
 * OperisChain — Extraction Chain
 *
 * LangChain LCEL chain for LLM-assisted rate extraction.
 * Uses DeepSeek (OpenAI-compatible API) for cost-efficient structured extraction.
 * ~10x cheaper than GPT-4o with comparable JSON extraction quality.
 *
 * Hybrid approach: DeepSeek for extraction, Claude Sonnet for reasoning.
 *
 * Every output validated with Zod. Every call traced with LangSmith.
 * confidence_score on every extraction. Below 0.7 = flag for review.
 */

import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ExtractionResultSchema, type ExtractionResult } from "../schemas";
import { buildExtractionPrompt } from "../extraction/rate-extractor";
import type { FreightMode } from "../db/schema";

/**
 * Create the extraction chain.
 *
 * Pipeline: document text → extraction prompt → DeepSeek → Zod validation
 *
 * DeepSeek is OpenAI-compatible, so we use ChatOpenAI with a custom baseURL.
 * The LLM extracts rates but the output is ALWAYS validated.
 * If validation fails, we throw and log — never pass bad data downstream.
 */
export function createExtractionChain(modeHint?: FreightMode) {
  const model = new ChatOpenAI({
    modelName: "deepseek-chat",
    temperature: 0, // Deterministic for extraction
    maxTokens: 8192, // DeepSeek max is 8192
    configuration: {
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
    },
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a freight rate extraction specialist. You extract structured rate data from logistics documents.
You MUST respond with valid JSON matching the required schema. No markdown, no code blocks, just raw JSON.
IMPORTANT: Do NOT wrap the JSON in markdown code fences. Output ONLY the raw JSON object.`,
    ],
    ["human", "{extractionPrompt}"],
  ]);

  const chain = RunnableSequence.from([
    // Step 1: Build the extraction prompt from document text
    {
      extractionPrompt: (input: { text: string }) =>
        buildExtractionPrompt(input.text, modeHint),
    },
    // Step 2: Send to DeepSeek
    prompt,
    model,
    // Step 3: Parse, coerce, and validate with Zod
    async (response) => {
      // Safely extract text content — handle both string and array formats
      let content: string;
      if (typeof response.content === "string") {
        content = response.content;
      } else if (Array.isArray(response.content)) {
        content = response.content
          .map((part: { type?: string; text?: string }) =>
            typeof part === "string" ? part : (part?.text ?? ""),
          )
          .join("");
      } else {
        content = String(response.content);
      }

      // Try to parse JSON from the response
      let parsed: unknown;
      try {
        // Strategy 1: Extract from markdown code blocks (```json ... ```) — greedy
        const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*)```/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1]!.trim());
        } else {
          // Strategy 2: Find the first { and last } for raw JSON
          const firstBrace = content.indexOf("{");
          const lastBrace = content.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace > firstBrace) {
            parsed = JSON.parse(content.substring(firstBrace, lastBrace + 1));
          } else {
            // Strategy 3: Try parsing the whole thing
            parsed = JSON.parse(content.trim());
          }
        }
      } catch (parseErr) {
        // Strategy 4: Strip code fences and try brace extraction
        try {
          const stripped = content.replace(/```(?:json)?/g, "").trim();
          const firstBrace = stripped.indexOf("{");
          const lastBrace = stripped.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace > firstBrace) {
            parsed = JSON.parse(stripped.substring(firstBrace, lastBrace + 1));
          } else {
            throw parseErr;
          }
        } catch {
          console.error(
            "Failed to parse LLM response. First 500 chars:",
            content.substring(0, 500),
          );
          throw new Error(
            `Failed to parse LLM response as JSON: ${content.substring(0, 200)}...`,
          );
        }
      }

      // Pre-process: coerce common LLM output mistakes before Zod validation
      if (parsed && typeof parsed === "object" && "rates" in parsed) {
        const obj = parsed as Record<string, unknown>;
        if (Array.isArray(obj.rates)) {
          obj.rates = obj.rates.map((rate: Record<string, unknown>) => {
            // Coerce surcharges: if object instead of array, wrap it
            if (rate.surcharges && !Array.isArray(rate.surcharges)) {
              if (typeof rate.surcharges === "object") {
                // All recognised surcharge type codes
                const KNOWN_TYPES = new Set([
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
                // Convert { BAF: "included", FSC: "excluded" } to array format
                const surchargesObj = rate.surcharges as Record<
                  string,
                  unknown
                >;
                rate.surcharges = Object.entries(surchargesObj).map(
                  ([key, val]) => ({
                    type: KNOWN_TYPES.has(key.toUpperCase())
                      ? key.toUpperCase()
                      : "OTHER",
                    status:
                      typeof val === "string"
                        ? val.toLowerCase().includes("includ") ||
                          val.toLowerCase().includes("incluid")
                          ? "included"
                          : val.toLowerCase().includes("exclud") ||
                              val.toLowerCase().includes("no inclu")
                            ? "excluded"
                            : "unknown"
                        : "unknown",
                    note: typeof val === "string" ? val : "",
                  }),
                );
              } else {
                rate.surcharges = [];
              }
            }

            // Coerce freight_mode / container_type / unit_type from snake_case
            if ("freight_mode" in rate && !("mode" in rate)) {
              rate.mode = rate.freight_mode;
              delete rate.freight_mode;
            }
            if ("container_type" in rate && !("containerType" in rate)) {
              rate.containerType = rate.container_type;
              delete rate.container_type;
            }
            if ("unit_type" in rate && !("unitType" in rate)) {
              rate.unitType = rate.unit_type;
              delete rate.unit_type;
            }

            // Coerce confidence_score from snake_case to camelCase
            if ("confidence_score" in rate && !("confidenceScore" in rate)) {
              rate.confidenceScore = rate.confidence_score;
              delete rate.confidence_score;
            }

            // Coerce transit_days from snake_case to camelCase
            if ("transit_days" in rate && !("transitDays" in rate)) {
              rate.transitDays = rate.transit_days;
              delete rate.transit_days;
            }

            // Coerce valid_until from snake_case to camelCase
            if ("valid_until" in rate && !("validUntil" in rate)) {
              rate.validUntil = rate.valid_until;
              delete rate.valid_until;
            }

            // Coerce weight_break_min/max from snake_case to camelCase
            if ("weight_break_min" in rate && !("weightBreakMin" in rate)) {
              rate.weightBreakMin = rate.weight_break_min;
              delete rate.weight_break_min;
            }
            if ("weight_break_max" in rate && !("weightBreakMax" in rate)) {
              rate.weightBreakMax = rate.weight_break_max;
              delete rate.weight_break_max;
            }

            // Coerce raw_text from snake_case to camelCase
            if ("raw_text" in rate && !("rawText" in rate)) {
              rate.rawText = rate.raw_text;
              delete rate.raw_text;
            }

            // Coerce price_per_unit from snake_case to camelCase
            if ("price_per_unit" in rate && !("pricePerUnit" in rate)) {
              rate.pricePerUnit = rate.price_per_unit;
              delete rate.price_per_unit;
            }

            // Coerce confidence_score alias
            if ("confidence" in rate && !("confidenceScore" in rate)) {
              rate.confidenceScore = rate.confidence;
              delete rate.confidence;
            }

            return rate;
          });
        }

        // Coerce document_summary snake_case
        if ("document_summary" in obj && !("documentSummary" in obj)) {
          obj.documentSummary = obj.document_summary;
          delete obj.document_summary;
        }
      }

      // Validate with Zod — if it doesn't match, throw
      const validated = ExtractionResultSchema.safeParse(parsed);
      if (!validated.success) {
        console.error(
          "Zod validation failed. Raw LLM output:",
          JSON.stringify(parsed, null, 2).substring(0, 1000),
        );
        throw new Error(
          `LLM output failed Zod validation: ${validated.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
        );
      }

      return validated.data;
    },
  ]);

  return chain;
}

/**
 * Run the extraction chain on a document text.
 *
 * @param text - The extracted text content from a document
 * @param modeHint - Optional freight mode hint (e.g. 'ocean_fcl', 'ground_ftl')
 * @returns Validated ExtractionResult with rates, summary, and warnings
 */
export async function extractRatesFromText(
  text: string,
  modeHint?: FreightMode,
): Promise<ExtractionResult> {
  const chain = createExtractionChain(modeHint);

  const result = await chain.invoke(
    { text },
    {
      // LangSmith tracing metadata
      metadata: {
        module: "extraction",
        version: "1.0",
      },
      tags: ["extraction", "quote-generator"],
    },
  );

  return result;
}
