/**
 * OperisChain — Ingest API Route
 *
 * POST /api/ingest
 *
 * Accepts document uploads (PDF, Excel, email text).
 * Extracts text, stores document record, returns document ID.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  extractText,
  detectDocumentType,
} from "@/lib/extraction/rate-extractor";
import { insertDocument } from "@/lib/db/queries";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const textContent = formData.get("text") as string | null;
    const clientId = formData.get("clientId") as string;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 },
      );
    }

    let text: string;
    let fileName: string;
    let fileType: "email" | "pdf" | "excel" | "word" | "csv" | "other";

    if (file) {
      // Handle file upload
      const buffer = Buffer.from(await file.arrayBuffer());
      const docType = detectDocumentType(file.name);
      text = await extractText(buffer, docType);
      fileName = file.name;
      fileType = docType === "text" ? "other" : docType;
    } else if (textContent) {
      // Handle pasted text (forwarded email)
      text = textContent;
      fileName = `pasted-email-${Date.now()}.txt`;
      fileType = "email";
    } else {
      return NextResponse.json(
        { error: "Either file or text content is required" },
        { status: 400 },
      );
    }

    // Store document record in DB
    const document = await insertDocument({
      clientId,
      fileName,
      fileType,
      rawText: text,
      processedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      documentId: document.id,
      fileName,
      fileType,
      textLength: text.length,
      textPreview: text.substring(0, 500),
    });
  } catch (error) {
    console.error("Ingestion error:", error);
    return NextResponse.json(
      { error: "Failed to process document", details: String(error) },
      { status: 500 },
    );
  }
}
