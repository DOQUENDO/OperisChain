/**
 * OperisChain — Rates API Route
 *
 * GET /api/rates — List rates for a client
 *
 * CRUD operations on the rates table.
 * These are the truth layer — extracted and validated rate data.
 */

import { NextRequest, NextResponse } from "next/server";
import { getRatesByClient } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const origin = searchParams.get("origin") || undefined;
    const destination = searchParams.get("destination") || undefined;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 },
      );
    }

    const rates = await getRatesByClient(clientId, { origin, destination });

    return NextResponse.json({
      rates,
      count: rates.length,
    });
  } catch (error) {
    console.error("Error fetching rates:", error);
    return NextResponse.json(
      { error: "Failed to fetch rates", details: String(error) },
      { status: 500 },
    );
  }
}
