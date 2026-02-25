/**
 * OperisChain — Recent Ingestion Jobs Endpoint
 *
 * GET /api/ingest/jobs?clientId=xxx
 *
 * Returns recent ingestion jobs for a client.
 * Used by the frontend to show email ingestion status.
 */

import { NextRequest, NextResponse } from "next/server";
import { getRecentIngestionJobs } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json(
      { error: "clientId is required" },
      { status: 400 },
    );
  }

  try {
    const jobs = await getRecentIngestionJobs(clientId);
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Error fetching ingestion jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs", details: String(error) },
      { status: 500 },
    );
  }
}
