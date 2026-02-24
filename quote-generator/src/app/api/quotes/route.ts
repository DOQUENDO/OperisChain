/**
 * OperisChain — Quotes API Route
 *
 * POST /api/quotes — Generate a new quote
 * GET  /api/quotes — List quotes for a client
 *
 * This orchestrates Stages 2-3:
 * Stage 2: SQL deterministic filter on rates table
 * Stage 3: LLM reasoning on filtered results
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getRatesForRoute,
  createQuote,
  getQuotesByClient,
} from "@/lib/db/queries";
import { rankRates } from "@/lib/scoring";
import { generateQuoteReasoning } from "@/lib/chains/quote.chain";
import {
  normalizeIATA,
  normalizeLocation,
  getLocationDisplayName,
} from "@/lib/extraction/normalizer";
import { getSurchargeWarnings } from "@/lib/surcharges";
import type { SurchargeFlag, FreightMode } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      origin,
      destination,
      weightKg,
      urgency = "unknown",
      mode = "air",
      containerType = "na",
      clientId,
      description,
    } = body;

    if (!origin || !destination || !weightKg || !clientId) {
      return NextResponse.json(
        { error: "origin, destination, weightKg, and clientId are required" },
        { status: 400 },
      );
    }

    const freightMode: FreightMode = mode;

    // Mode-aware location normalization
    let originCode: string | null;
    let destCode: string | null;
    let originWarning: string | null = null;
    let destWarning: string | null = null;

    if (freightMode === "air" || freightMode === "courier") {
      const originNorm = normalizeIATA(origin);
      const destNorm = normalizeIATA(destination);
      originCode = originNorm.code;
      destCode = destNorm.code;
      originWarning = originNorm.warning;
      destWarning = destNorm.warning;
    } else {
      const originNorm = normalizeLocation(origin, freightMode);
      const destNorm = normalizeLocation(destination, freightMode);
      originCode = originNorm.code;
      destCode = destNorm.code;
      originWarning = originNorm.warning;
      destWarning = destNorm.warning;
    }

    if (!originCode || !destCode) {
      return NextResponse.json(
        {
          error: "Could not resolve location codes",
          details: {
            origin: originWarning,
            destination: destWarning,
          },
        },
        { status: 400 },
      );
    }

    // ─── Stage 2: SQL Deterministic Filter ───
    const rates = await getRatesForRoute({
      origin: originCode,
      destination: destCode,
      weightKg,
      clientId,
      freightMode,
    });

    if (rates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: `No rates found for route ${getLocationDisplayName(originCode)} → ${getLocationDisplayName(destCode)} at ${weightKg}kg. Please upload carrier rate documents first.`,
          origin: getLocationDisplayName(originCode),
          destination: getLocationDisplayName(destCode),
          originCode,
          destinationCode: destCode,
        },
        { status: 404 },
      );
    }

    // ─── Score and rank rates ───
    const scoredRates = rankRates(
      rates.map((r) => ({
        ...r,
        price: Number(r.price),
        transitDays: r.transitDays,
        confidenceScore: r.confidenceScore,
        surcharges: (r.surcharges || []) as SurchargeFlag[],
        validUntil: r.validUntil,
        freightMode: r.freightMode as FreightMode,
      })),
      { urgency, mode: freightMode },
    );

    // ─── Stage 3: LLM Reasoning ───
    const reasoning = await generateQuoteReasoning({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rates: scoredRates as any,
      cargo: {
        origin: originCode,
        destination: destCode,
        weightKg,
        urgency,
        mode: freightMode,
        description,
      },
    });

    // ─── Build quote lines ───
    const quoteLines = scoredRates.map((rate) => {
      const unitPrice = rate.price;
      const unitType = rate.unitType || "per_kg";
      // Calculate total: per-kg rates × weight, flat rates stay as-is
      const totalPrice =
        unitType === "per_kg" || unitType === "per_ton"
          ? unitPrice * (unitType === "per_ton" ? weightKg / 1000 : weightKg)
          : unitPrice;

      return {
        // DB fields
        rateId: rate.id,
        carrier: rate.carrier,
        route: `${getLocationDisplayName(rate.origin)} → ${getLocationDisplayName(rate.destination)}`,
        priceUSD: String(unitPrice),
        transitDays: rate.transitDays,
        validUntil: rate.validUntil,
        validityWarning: rate.validityWarning,
        surchargeFlags: rate.surcharges as SurchargeFlag[],
        confidenceScore: rate.confidenceScore,
        sourceDocId: rate.sourceDocId,
        score: rate.score,
        // Computed (not stored in DB)
        _totalPriceUSD: totalPrice,
        _unitType: unitType,
      };
    });

    // ─── Store quote in DB ───
    // Strip computed fields before inserting
    const dbLines = quoteLines.map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ _totalPriceUSD: _, _unitType: __, ...rest }) => rest,
    );
    const quoteResult = await createQuote(
      {
        clientId,
        origin: originCode,
        destination: destCode,
        weightKg: String(weightKg),
        urgency,
        freightMode,
        containerType: containerType || "na",
        cargoDescription: description || null,
        recommendedCarrier: reasoning.recommended,
        reasoning: reasoning.reasoning,
        needsClarification: reasoning.needsClarification,
        clarificationQuestion: reasoning.clarificationQuestion,
      },
      dbLines,
    );

    // ─── Build response ───
    return NextResponse.json({
      success: true,
      quote: {
        quoteId: quoteResult.quote.id,
        generatedAt: quoteResult.quote.generatedAt,
        cargo: {
          origin: getLocationDisplayName(originCode),
          destination: getLocationDisplayName(destCode),
          originCode,
          destinationCode: destCode,
          weightKg,
          urgency,
          mode: freightMode,
        },
        lines: quoteResult.lines.map((line, i) => ({
          ...line,
          totalPriceUSD: quoteLines[i]?._totalPriceUSD ?? Number(line.priceUSD),
          unitType: quoteLines[i]?._unitType ?? "flat_rate",
          surchargeWarning: getSurchargeWarnings(
            line.surchargeFlags as SurchargeFlag[],
          ),
        })),
        recommended: reasoning.recommended,
        reasoning: reasoning.reasoning,
        needsClarification: reasoning.needsClarification,
        clarificationQuestion: reasoning.clarificationQuestion,
        lineNotes: reasoning.lineNotes,
      },
    });
  } catch (error) {
    console.error("Quote generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate quote", details: String(error) },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 },
      );
    }

    const quotes = await getQuotesByClient(clientId);
    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes", details: String(error) },
      { status: 500 },
    );
  }
}
