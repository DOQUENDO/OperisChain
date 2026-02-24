/**
 * OperisChain — Leads API Route
 *
 * POST /api/leads — Capture demo request from landing page
 *
 * Pipeline:
 * 1. Validate & sanitize form data
 * 2. Insert into Supabase `leads` table
 * 3. Send email notification to diego.oquendo35@gmail.com
 * 4. Send auto-reply to the lead
 * 5. Return success with lead ID
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, type Lead } from "@/lib/db/schema";
import { Resend } from "resend";
import { desc, eq, count } from "drizzle-orm";

const resend = new Resend(process.env.RESEND_API_KEY);

const NOTIFY_EMAIL = "diego.oquendo35@gmail.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

// ─── CORS ───
const ALLOWED_ORIGINS = [
  "https://operischain.com",
  "https://www.operischain.com",
  "http://localhost:8080",
  "http://localhost:3000",
  "http://127.0.0.1:8080",
];

function getCorsHeaders(request?: NextRequest) {
  const origin = request?.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// Handle preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ─── 1. Validate required fields ───
    const { name, email, company, size, phone, message, plan, language } = body;

    if (!name || !email || !company || !size || !phone || !message) {
      return NextResponse.json(
        {
          error: "name, email, company, size, phone, and message are required",
        },
        { status: 400, headers: getCorsHeaders(request) },
      );
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400, headers: getCorsHeaders(request) },
      );
    }

    // Validate phone format
    const phoneRegex = /^[\d\s\+\-\(\)]{7,20}$/;
    if (!phoneRegex.test(phone.trim())) {
      return NextResponse.json(
        { error: "Invalid phone format" },
        { status: 400, headers: getCorsHeaders(request) },
      );
    }

    // Validate message length
    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters" },
        { status: 400, headers: getCorsHeaders(request) },
      );
    }

    // Validate team size
    const validSizes = ["1-5", "5-20", "20-50", "50+"] as const;
    if (!validSizes.includes(size)) {
      return NextResponse.json(
        { error: "Invalid team size" },
        { status: 400, headers: getCorsHeaders(request) },
      );
    }

    // Extract tracking data from headers
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Extract UTM params if present
    const url = new URL(request.url);
    const utmSource = body.utmSource || url.searchParams.get("utm_source");
    const utmMedium = body.utmMedium || url.searchParams.get("utm_medium");
    const utmCampaign =
      body.utmCampaign || url.searchParams.get("utm_campaign");

    // ─── 2. Insert lead into Supabase ───
    const [lead] = await db
      .insert(leads)
      .values({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        company: company.trim(),
        teamSize: size,
        phone: phone.trim(),
        message: message.trim(),
        planInterest: plan || null,
        language: language || "en",
        source: "landing_page",
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        ipAddress,
        userAgent,
      })
      .returning();

    // ─── 3. Send notification email to Diego ───
    let notified = false;
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: NOTIFY_EMAIL,
        subject: `🚀 New Demo Request — ${lead.company} (${lead.planInterest || "General"})`,
        html: buildNotificationEmail(lead),
      });

      // Mark notification sent
      await db
        .update(leads)
        .set({ notifiedAt: new Date() })
        .where(eq(leads.id, lead.id));
      notified = true;
    } catch (emailError) {
      console.error("Failed to send notification email:", emailError);
      // Don't fail the request — lead is already saved
    }

    // ─── 4. Send auto-reply to the lead ───
    let autoReplied = false;
    try {
      const isSpanish = language === "es";
      await resend.emails.send({
        from: FROM_EMAIL,
        to: lead.email,
        subject: isSpanish
          ? "✅ Recibimos tu solicitud de demo — OperisChain"
          : "✅ We received your demo request — OperisChain",
        html: buildAutoReplyEmail(lead, isSpanish),
      });

      await db
        .update(leads)
        .set({ autoRepliedAt: new Date() })
        .where(eq(leads.id, lead.id));
      autoReplied = true;
    } catch (emailError) {
      console.error("Failed to send auto-reply:", emailError);
    }

    // ─── 5. Return success ───
    return NextResponse.json(
      {
        success: true,
        leadId: lead.id,
        notified,
        autoReplied,
      },
      { status: 201, headers: getCorsHeaders(request) },
    );
  } catch (error) {
    console.error("Lead capture error:", error);
    return NextResponse.json(
      { error: "Failed to process demo request" },
      { status: 500, headers: getCorsHeaders(request) },
    );
  }
}

// ─── GET /api/leads — List leads (internal/admin use) ───
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    let query = db
      .select()
      .from(leads)
      .orderBy(desc(leads.createdAt))
      .limit(limit);

    if (status) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = query.where(eq(leads.status, status as any)) as typeof query;
    }

    const results = await query;

    // Also get total count
    const [{ total }] = await db.select({ total: count() }).from(leads);

    return NextResponse.json({
      leads: results,
      total,
      count: results.length,
    });
  } catch (error) {
    console.error("Lead list error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve leads" },
      { status: 500 },
    );
  }
}

// ═══════════════════════════════════════
// Email Templates
// ═══════════════════════════════════════

function buildNotificationEmail(lead: Lead): string {
  return `
  <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a12; color: #e2e8f0; border-radius: 12px; overflow: hidden; border: 1px solid #1e1e2e;">
    <div style="background: linear-gradient(135deg, #00d4ff, #7b2ff7); padding: 24px 32px;">
      <h1 style="margin: 0; font-size: 20px; color: white;">🚀 New Demo Request</h1>
      <p style="margin: 4px 0 0; font-size: 14px; color: rgba(255,255,255,0.85);">OperisChain Lead Pipeline</p>
    </div>
    <div style="padding: 32px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Name</td><td style="padding: 8px 0; color: #f1f5f9; font-weight: 600;">${lead.name}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Email</td><td style="padding: 8px 0;"><a href="mailto:${lead.email}" style="color: #00d4ff;">${lead.email}</a></td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Company</td><td style="padding: 8px 0; color: #f1f5f9; font-weight: 600;">${lead.company}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Team Size</td><td style="padding: 8px 0; color: #f1f5f9;">${lead.teamSize}</td></tr>
        ${lead.phone ? `<tr><td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Phone</td><td style="padding: 8px 0;"><a href="tel:${lead.phone}" style="color: #00d4ff;">${lead.phone}</a></td></tr>` : ""}
        <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Plan Interest</td><td style="padding: 8px 0; color: #f1f5f9;">${lead.planInterest || "Not specified"}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Language</td><td style="padding: 8px 0; color: #f1f5f9;">${lead.language === "es" ? "🇨🇴 Spanish" : "🇺🇸 English"}</td></tr>
        ${lead.message ? `<tr><td colspan="2" style="padding: 16px 0 8px; color: #94a3b8; font-size: 13px;">Message</td></tr><tr><td colspan="2" style="padding: 8px 16px; background: #111119; border-radius: 8px; color: #cbd5e1; font-size: 14px; line-height: 1.6;">${lead.message}</td></tr>` : ""}
      </table>
      ${lead.utmSource ? `<p style="margin-top: 24px; font-size: 12px; color: #64748b;">Source: ${lead.utmSource} / ${lead.utmMedium || "direct"} / ${lead.utmCampaign || "none"}</p>` : ""}
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #1e1e2e;">
        <p style="font-size: 13px; color: #64748b; margin: 0;">Lead ID: ${lead.id}</p>
        <p style="font-size: 13px; color: #64748b; margin: 4px 0 0;">Received: ${new Date(lead.createdAt).toLocaleString("en-US", { timeZone: "America/Bogota" })} (COT)</p>
      </div>
    </div>
  </div>`;
}

function buildAutoReplyEmail(lead: Lead, isSpanish: boolean): string {
  if (isSpanish) {
    return `
    <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #1a1a2e; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(135deg, #00d4ff, #7b2ff7); padding: 32px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; color: white;">¡Recibimos tu solicitud!</h1>
      </div>
      <div style="padding: 32px;">
        <p style="font-size: 16px; line-height: 1.6; color: #334155;">Hola <strong>${lead.name}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6; color: #334155;">Gracias por tu interés en OperisChain. Recibimos tu solicitud de demo${lead.planInterest ? ` para el plan <strong>${lead.planInterest}</strong>` : ""}.</p>
        <p style="font-size: 16px; line-height: 1.6; color: #334155;">Nuestro equipo se pondrá en contacto contigo en las próximas <strong>24 horas</strong> para coordinar una demo personalizada para <strong>${lead.company}</strong>.</p>
        <div style="margin: 32px 0; padding: 24px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #00d4ff;">
          <p style="font-size: 14px; color: #475569; margin: 0;"><strong>¿Qué esperar?</strong></p>
          <ul style="margin: 12px 0 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 2;">
            <li>Demo en vivo de los módulos relevantes para tu operación</li>
            <li>Análisis de tu flujo de trabajo actual</li>
            <li>Propuesta personalizada con ROI estimado</li>
          </ul>
        </div>
        <p style="font-size: 14px; color: #64748b; line-height: 1.6;">Mientras tanto, puedes responder a este correo si tienes alguna pregunta.</p>
        <p style="font-size: 16px; color: #334155; margin-top: 24px;">— El equipo de OperisChain</p>
      </div>
      <div style="padding: 16px 32px; background: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">OperisChain · AI para Freight Forwarding · operischain.com</p>
      </div>
    </div>`;
  }

  return `
  <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #1a1a2e; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
    <div style="background: linear-gradient(135deg, #00d4ff, #7b2ff7); padding: 32px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; color: white;">We received your request!</h1>
    </div>
    <div style="padding: 32px;">
      <p style="font-size: 16px; line-height: 1.6; color: #334155;">Hi <strong>${lead.name}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.6; color: #334155;">Thanks for your interest in OperisChain. We received your demo request${lead.planInterest ? ` for the <strong>${lead.planInterest}</strong> plan` : ""}.</p>
      <p style="font-size: 16px; line-height: 1.6; color: #334155;">Our team will reach out within <strong>24 hours</strong> to schedule a personalized demo for <strong>${lead.company}</strong>.</p>
      <div style="margin: 32px 0; padding: 24px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #00d4ff;">
        <p style="font-size: 14px; color: #475569; margin: 0;"><strong>What to expect:</strong></p>
        <ul style="margin: 12px 0 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 2;">
          <li>Live demo of the modules relevant to your operation</li>
          <li>Analysis of your current workflow</li>
          <li>Custom proposal with estimated ROI</li>
        </ul>
      </div>
      <p style="font-size: 14px; color: #64748b; line-height: 1.6;">In the meantime, feel free to reply to this email with any questions.</p>
      <p style="font-size: 16px; color: #334155; margin-top: 24px;">— The OperisChain Team</p>
    </div>
    <div style="padding: 16px 32px; background: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">OperisChain · AI for Freight Forwarding · operischain.com</p>
    </div>
  </div>`;
}
