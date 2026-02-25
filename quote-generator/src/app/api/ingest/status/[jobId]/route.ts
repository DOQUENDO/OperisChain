/**
 * OperisChain — Ingestion Job Status Endpoint
 *
 * GET /api/ingest/status/[jobId]
 *
 * Returns the current status of an ingestion job.
 * Used by the frontend to poll for completion after email forwarding.
 */

import { NextRequest, NextResponse } from "next/server";
import { getIngestionJob } from "@/lib/db/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  const { jobId } = params;

  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  try {
    const job = await getIngestionJob(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      source: job.source,
      documentId: job.documentId,
      ratesExtracted: job.ratesExtracted,
      errorMessage: job.errorMessage,
      emailSubject: job.emailSubject,
      emailFrom: job.emailFrom,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching job status:", error);
    return NextResponse.json(
      { error: "Failed to fetch job status", details: String(error) },
      { status: 500 },
    );
  }
}
