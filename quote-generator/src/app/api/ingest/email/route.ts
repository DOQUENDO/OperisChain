/**
 * OperisChain — Inbound Email Ingestion Webhook
 *
 * POST /api/ingest/email
 *
 * Receives Postmark inbound webhook payloads when a broker forwards
 * a carrier rate email to rates@operischain.com.
 *
 * Flow:
 * 1. Validate URL token (webhook security — Postmark inbound doesn't sign payloads)
 * 2. Create an ingestion_job record (status: pending)
 * 3. Respond 200 immediately (Postmark requires fast response)
 * 4. Process asynchronously: parse email → extract rates → store in DB
 *
 * Security: Postmark inbound webhooks do NOT provide HMAC signatures
 * (unlike outbound event webhooks). We secure the endpoint with a
 * secret token in the URL query string: ?token=YOUR_SECRET
 *
 * Uses waitUntil() to run processing after response is sent,
 * avoiding Vercel function timeout issues.
 */

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { parseEmail } from "@/lib/extraction/email";
import {
  extractText,
  detectDocumentType,
  normalizeExtractedRate,
} from "@/lib/extraction/rate-extractor";
import { extractRatesFromText } from "@/lib/chains/extract.chain";
import {
  insertDocument,
  insertRates,
  createIngestionJob,
  updateIngestionJob,
} from "@/lib/db/queries";

// TODO [V2]: Per-client routing via email subdomain.
// For now, use a shared demo inbox. The client_id comes from env.
const DEMO_CLIENT_ID =
  process.env.DEMO_CLIENT_ID || "ca99cf7d-0899-4ded-af9f-20338015c0a1";

/**
 * Postmark inbound webhook JSON payload shape (relevant fields).
 * See: https://postmarkapp.com/developer/webhooks/inbound-webhook
 */
interface PostmarkInboundPayload {
  From: string;
  FromName: string;
  To: string;
  Subject: string;
  TextBody: string;
  HtmlBody: string;
  Date: string;
  MessageID: string;
  Attachments: PostmarkAttachment[];
  RawEmail?: string; // Full MIME source (if enabled in Postmark)
}

interface PostmarkAttachment {
  Name: string;
  Content: string; // Base64-encoded
  ContentType: string;
  ContentLength: number;
}

/**
 * Validate the webhook URL token.
 * Postmark inbound webhooks do NOT provide HMAC signatures,
 * so we secure the endpoint with a secret token in the query string.
 *
 * Webhook URL format: https://app.operischain.com/api/ingest/email?token=YOUR_SECRET
 */
function validateWebhookToken(request: NextRequest): boolean {
  const secret = process.env.INBOUND_WEBHOOK_TOKEN;

  // If no token configured, skip validation in development
  if (!secret) {
    console.warn(
      "[Email Webhook] INBOUND_WEBHOOK_TOKEN not set — skipping token validation",
    );
    return true;
  }

  const token = request.nextUrl.searchParams.get("token");
  if (!token) return false;

  // Constant-time comparison to prevent timing attacks
  if (token.length !== secret.length) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  try {
    return timingSafeEqual(a, b);
  } catch {
    return token === secret;
  }
}

export async function POST(request: NextRequest) {
  // ─── Step 1: Validate webhook token ───
  if (!validateWebhookToken(request)) {
    console.error(
      "[Email Webhook] Invalid or missing token — rejecting request",
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Read and parse the payload
  const rawBody = await request.text();
  let payload: PostmarkInboundPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  // ─── Step 2: Create ingestion job immediately (pending) ───
  let job;
  try {
    job = await createIngestionJob({
      clientId: DEMO_CLIENT_ID,
      status: "pending",
      source: "email",
      emailSubject: payload.Subject || "No subject",
      emailFrom: payload.From || "unknown",
    });
  } catch (err) {
    console.error("[Email Webhook] Failed to create ingestion job:", err);
    return NextResponse.json(
      { error: "Failed to create ingestion job" },
      { status: 500 },
    );
  }

  // ─── Step 3: Respond 200 immediately ───
  // Postmark requires a fast 200 response. Process asynchronously below.
  const response = NextResponse.json({
    success: true,
    jobId: job.id,
    message: "Email received, processing started",
  });

  // ─── Step 4: Process email asynchronously ───
  // Use waitUntil if available (Vercel), otherwise fire-and-forget Promise
  const processingPromise = processInboundEmail(job.id, payload);

  // @ts-expect-error — waitUntil is available in Vercel's edge/serverless runtime
  if (typeof globalThis.waitUntil === "function") {
    // @ts-expect-error — Vercel runtime global
    globalThis.waitUntil(processingPromise);
  } else {
    // Fallback: fire and forget (works in dev, may be cut short on serverless)
    processingPromise.catch((err) =>
      console.error("[Email Webhook] Background processing failed:", err),
    );
  }

  return response;
}

/**
 * Process the inbound email: parse → extract → normalize → store.
 * Runs asynchronously after the 200 response is sent.
 */
async function processInboundEmail(
  jobId: string,
  payload: PostmarkInboundPayload,
): Promise<void> {
  try {
    // Mark as processing
    await updateIngestionJob(jobId, { status: "processing" });

    // ─── Parse email content ───
    let emailText = "";
    const allTexts: string[] = [];

    // 1. Parse the email body
    if (payload.RawEmail) {
      // Full MIME source — use mailparser for best results
      const parsed = await parseEmail(Buffer.from(payload.RawEmail, "utf-8"));
      emailText = parsed.textBody || parsed.htmlBody;
    } else if (payload.TextBody) {
      emailText = payload.TextBody;
    } else if (payload.HtmlBody) {
      // Strip HTML tags for basic text extraction
      emailText = payload.HtmlBody.replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    if (emailText) {
      allTexts.push(
        `Subject: ${payload.Subject}\nFrom: ${payload.From}\nDate: ${payload.Date}\n\n${emailText}`,
      );
    }

    // 2. Process attachments (PDF, Excel, etc.)
    if (payload.Attachments && payload.Attachments.length > 0) {
      for (const att of payload.Attachments) {
        try {
          const buffer = Buffer.from(att.Content, "base64");
          const docType = detectDocumentType(att.Name);
          if (docType === "pdf" || docType === "excel" || docType === "csv") {
            const attText = await extractText(buffer, docType);
            if (attText.trim()) {
              allTexts.push(`--- Attachment: ${att.Name} ---\n${attText}`);
            }
          }
        } catch (attErr) {
          console.warn(
            `[Email Webhook] Failed to parse attachment ${att.Name}:`,
            attErr,
          );
        }
      }
    }

    // Combine all text sources
    const combinedText = allTexts.join("\n\n");

    if (!combinedText.trim()) {
      await updateIngestionJob(jobId, {
        status: "failed",
        errorMessage: "No extractable text found in email or attachments",
      });
      return;
    }

    // ─── Store document ───
    const document = await insertDocument({
      clientId: DEMO_CLIENT_ID,
      fileName: `email-${payload.MessageID || Date.now()}.eml`,
      fileType: "email",
      rawText: combinedText,
      processedAt: new Date(),
    });

    // Link document to job
    await updateIngestionJob(jobId, { documentId: document.id });

    // ─── Run extraction chain (same as manual upload) ───
    const extraction = await extractRatesFromText(combinedText);

    // Normalize extracted rates
    const processedRates = extraction.rates.map((raw) =>
      normalizeExtractedRate(raw, DEMO_CLIENT_ID, document.id),
    );

    // Insert rates into DB
    const normalizedRates = processedRates.map((r) => r.normalized);
    const insertedRates =
      normalizedRates.length > 0 ? await insertRates(normalizedRates) : [];

    // ─── Mark job as done ───
    await updateIngestionJob(jobId, {
      status: "done",
      ratesExtracted: insertedRates.length,
    });

    console.log(
      `[Email Webhook] Job ${jobId} complete: ${insertedRates.length} rates extracted from "${payload.Subject}"`,
    );
  } catch (err) {
    console.error(`[Email Webhook] Job ${jobId} failed:`, err);
    await updateIngestionJob(jobId, {
      status: "failed",
      errorMessage: String(err),
    }).catch(() => {}); // Don't throw if status update also fails
  }
}
