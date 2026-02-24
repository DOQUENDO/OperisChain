/**
 * OperisChain — Seed Script
 *
 * Inserts a test client and ingests all 8 fixture documents into the DB.
 * Does NOT call the LLM — just inserts the raw documents so you can
 * test extraction via the API or manually.
 *
 * Usage: npx tsx tests/seed.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";

const FIXTURES_DIR = path.resolve(__dirname, "fixtures");

interface FixtureDef {
  fileName: string;
  fileType: "email" | "pdf" | "excel" | "csv" | "other";
  subDir: string;
  description: string;
}

const FIXTURES: FixtureDef[] = [
  // Emails
  {
    fileName: "01-avianca-cargo-rates.eml",
    fileType: "email",
    subDir: "emails",
    description:
      "Avianca Cargo — BOG→MIA rates, clean table, surcharges explicit",
  },
  {
    fileName: "02-latam-cargo-forwarded.eml",
    fileType: "email",
    subDir: "emails",
    description:
      "LATAM Cargo — forwarded email, BOG→SCL + BOG→EZE, validity 'hasta nuevo aviso'",
  },
  {
    fileName: "03-dhl-messy-email.eml",
    fileType: "email",
    subDir: "emails",
    description:
      "DHL Express — messy formatting, mixed currencies (USD/EUR/COP), incomplete data",
  },
  {
    fileName: "09-maersk-ocean-fcl-es.eml",
    fileType: "email",
    subDir: "emails",
    description:
      "Maersk Line — Ocean FCL COBUN→NLRTM, Spanish, 5 container types, THC/BAF/ISPS surcharges",
  },
  {
    fileName: "10-coordinadora-ground-es.eml",
    fileType: "email",
    subDir: "emails",
    description:
      "Coordinadora — Ground FTL+LTL Colombian national routes, Spanish, COP currency, tolls/fuel/insurance",
  },
  // PDFs (text format for testing)
  {
    fileName: "04-fedex-ratecard.txt",
    fileType: "other", // "text" type — simulates parsed PDF text
    subDir: "pdfs",
    description:
      "FedEx — 3 routes (BOG→MIA, BOG→JFK, MDE→MIA), structured rate card",
  },
  {
    fileName: "05-cargolux-contract.txt",
    fileType: "other",
    subDir: "pdfs",
    description:
      "Cargolux — European routes (BOG→AMS, BOG→FRA), contract with long validity",
  },
  {
    fileName: "06-tampa-cargo-circular.txt",
    fileType: "other",
    subDir: "pdfs",
    description:
      "Tampa Cargo — domestic (BOG→MDE in COP) + intl (BOG→PTY, BOG→LIM), box-drawing chars",
  },
  {
    fileName: "11-seaboard-ocean-lcl-es.txt",
    fileType: "other",
    subDir: "pdfs",
    description:
      "Seaboard Marine — Ocean LCL Colombia→Caribbean/Central America, Spanish, CBM/ton pricing",
  },
  // Excel
  {
    fileName: "07-copa-cargo-rates.xlsx",
    fileType: "excel",
    subDir: "excel",
    description:
      "Copa Cargo — clean single-carrier sheet (BOG→PTY, BOG→MEX, BOG→GRU)",
  },
  {
    fileName: "08-multi-carrier-comparison.xlsx",
    fileType: "excel",
    subDir: "excel",
    description:
      "Multi-carrier comparison — 3 sheets (BOG→MIA compare, BOG→SCL compare, histórico)",
  },
  {
    fileName: "12-multimodal-comparison-es.xlsx",
    fileType: "excel",
    subDir: "excel",
    description:
      "Multimodal comparison — Air/Ocean/Ground/Courier BOG→MIA + national ground rates, Spanish",
  },
];

async function main() {
  console.log("🌱 OperisChain — Seeding test data...\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found. Check .env.local");
    process.exit(1);
  }

  // Connect directly (not via the app's db module to avoid Next.js deps)
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(sql, { schema });

  // ── Step 1: Create test client ──
  console.log("1️⃣  Creating test client...");

  const [client] = await db
    .insert(schema.clients)
    .values({
      name: "OperisChain Test Client",
      contactEmail: "test@operischain.com",
      contactPhone: "+57 300 123 4567",
      company: "OperisChain Logistics SAS",
      notes: "Test client for development — seeded fixtures",
    })
    .returning();

  console.log(`   ✓ Client created: ${client.id}`);
  console.log(`   Name: ${client.name}`);

  // ── Step 2: Insert document records ──
  console.log("\n2️⃣  Inserting document records...\n");

  const insertedDocs: { id: string; fileName: string }[] = [];

  for (const fixture of FIXTURES) {
    const filePath = path.join(FIXTURES_DIR, fixture.subDir, fixture.fileName);

    // Read raw text content
    let rawText: string;
    if (fixture.fileType === "excel") {
      // For Excel, just store a note — the actual parsing happens during extraction
      rawText = `[Excel file — parse with xlsx library]\nFile: ${fixture.fileName}`;
    } else {
      rawText = fs.readFileSync(filePath, "utf-8");
    }

    const [doc] = await db
      .insert(schema.documents)
      .values({
        clientId: client.id,
        fileName: fixture.fileName,
        fileType: fixture.fileType === "other" ? "other" : fixture.fileType,
        rawText,
        metadata: {
          description: fixture.description,
          fixtureSubDir: fixture.subDir,
          seededAt: new Date().toISOString(),
        },
      })
      .returning();

    insertedDocs.push({ id: doc.id, fileName: fixture.fileName });
    console.log(`   ✓ ${fixture.fileName}`);
    console.log(`     ID: ${doc.id}`);
    console.log(`     Type: ${fixture.fileType} | ${fixture.description}`);
    console.log();
  }

  // ── Summary ──
  console.log("═══════════════════════════════════════════════════");
  console.log("✅ Seed complete!\n");
  console.log(`Client ID: ${client.id}`);
  console.log(`Documents: ${insertedDocs.length}\n`);
  console.log("Next steps:");
  console.log("  1. Update DEMO_CLIENT_ID in your dashboard page:");
  console.log(`     const DEMO_CLIENT_ID = "${client.id}";`);
  console.log(
    "  2. Call POST /api/extract with each document ID to run LLM extraction",
  );
  console.log("  3. Call POST /api/quotes to generate a quote comparison\n");

  console.log("Document IDs for extraction:");
  for (const doc of insertedDocs) {
    console.log(`  ${doc.fileName}: ${doc.id}`);
  }

  // Close connection
  await sql.end();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
