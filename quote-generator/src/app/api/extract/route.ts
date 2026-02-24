/**
 * OperisChain — Extract API Route
 *
 * POST /api/extract
 *
 * Takes a document ID, runs the LLM extraction chain,
 * normalizes the results, and stores rates in the DB.
 *
 * This is Stage 1: Deterministic Extraction.
 */

import { NextRequest, NextResponse } from "next/server";
import { extractRatesFromText } from "@/lib/chains/extract.chain";
import { normalizeExtractedRate } from "@/lib/extraction/rate-extractor";
import { insertRates } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { documents, type FreightMode } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, clientId, mode: modeRaw } = body;
    const mode = (modeRaw || undefined) as FreightMode | undefined;

    if (!documentId || !clientId) {
      return NextResponse.json(
        { error: "documentId and clientId are required" },
        { status: 400 },
      );
    }

    // Get document text from DB
    const doc = await db.query.documents.findFirst({
      where: eq(documents.id, documentId),
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    if (!doc.rawText) {
      return NextResponse.json(
        { error: "Document has no text content" },
        { status: 400 },
      );
    }

    // Run LLM extraction chain (pass mode hint for mode-specific prompting)
    const extraction = await extractRatesFromText(doc.rawText, mode);

    // Normalize each extracted rate
    const processedRates = extraction.rates.map((raw) =>
      normalizeExtractedRate(raw, clientId, documentId, mode),
    );

    // Collect all warnings
    const allWarnings = [
      ...extraction.warnings,
      ...processedRates.flatMap((r) => r.warnings),
    ];

    // Insert normalized rates into DB
    const normalizedRates = processedRates.map((r) => r.normalized);
    const insertedRates =
      normalizedRates.length > 0 ? await insertRates(normalizedRates) : [];

    // Flag low-confidence rates
    const lowConfidence = processedRates.filter(
      (r) => r.raw.confidenceScore < 0.7,
    );

    return NextResponse.json({
      success: true,
      ratesExtracted: insertedRates.length,
      rates: insertedRates,
      documentSummary: extraction.documentSummary,
      warnings: allWarnings,
      lowConfidenceCount: lowConfidence.length,
      lowConfidenceRates: lowConfidence.map((r) => ({
        carrier: r.normalized.carrier,
        confidence: r.raw.confidenceScore,
        warnings: r.warnings,
      })),
    });
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract rates", details: String(error) },
      { status: 500 },
    );
  }
}
