# OperisChain — Business Moats, Roadmap & Architecture Blueprint

> **Last updated:** February 2026  
> **Status:** V1 functional (air, ocean, ground). Multi-modal extraction + i18n (ES/EN) complete.

---

## Table of Contents

1. [Competitive Moats](#1-competitive-moats)
2. [Feature Roadmap](#2-feature-roadmap)
3. [Target Architecture](#3-target-architecture)
4. [Key Architecture Decisions](#4-key-architecture-decisions)
5. [Revenue Model](#5-revenue-model)
6. [Current Technical Stack](#6-current-technical-stack)

---

## 1. Competitive Moats

### 1.1 Data Network Effect

**What:** Every rate document uploaded by every client makes OperisChain smarter. More carriers, more routes, more historical data points. A new competitor starts with zero data.

**How it compounds:** Client A uploads Avianca air rates for BOG→MIA. Client B uploads LATAM rates for the same route. Now OperisChain knows the competitive landscape for that lane — neither client could have that alone. After 100 clients, we have the most comprehensive LatAm freight pricing database in existence.

**How to build it:**

- Store every extracted rate permanently with timestamps (never delete, only mark as expired)
- Build a `rate_history` table that tracks price changes per carrier/route/mode over time
- Create pricing indices per trade lane (e.g., "BOG→MIA Air Average: $2.35/kg, trend: +3% QoQ")
- The database becomes the product — the more data in it, the more valuable the platform becomes

**Defensibility:** A competitor would need to acquire the same volume of rate documents organically. There's no shortcut — each document represents a real broker-carrier relationship.

---

### 1.2 Carrier-Specific Extraction Models

**What:** Every carrier formats their rates differently. Avianca sends Excel tables with IATA codes. Coordinadora sends PDFs with Colombian city names and COP pricing. Maersk sends structured emails with container types. A one-size-fits-all extractor will always have lower accuracy than carrier-tuned models.

**How it compounds:** After processing 50+ documents from Coordinadora, we know:

- They always include COP pricing (needs USD conversion)
- Their routes use Colombian city names, not UNLOCODE codes
- They separate LTL and FTL in specific column patterns
- Their surcharge structure includes "manejo" and "seguro" line items

This knowledge becomes a **carrier extraction profile** that no competitor has.

**How to build it:**

- Track extraction accuracy per carrier (confidence scores, manual corrections)
- Build a `carrier_profiles` table: `{ carrier, format_hints, common_surcharges, pricing_currency, location_format }`
- When accuracy drops below threshold for a carrier, flag for prompt refinement
- Long-term: fine-tune lightweight models per carrier (LoRA adapters on a base extraction model)
- Create a feedback loop: when a user corrects an extracted rate, log the correction and improve the carrier profile

**Defensibility:** Each carrier profile is earned through real-world documents. A competitor would need to process the same volume of carrier-specific documents to match accuracy.

---

### 1.3 LatAm Domain Expertise

**What:** Latin American freight forwarding has unique complexities that generic logistics tools (built for US/EU markets) don't handle:

- **Dual currency:** COP and USD pricing coexist in the same document
- **DIAN customs:** Colombian import/export regulations, tariff codes, and documentation requirements
- **Port-specific surcharges:** Buenaventura congestion fees, Cartagena security charges, Santa Marta handling
- **Location ambiguity:** "Bogotá" could be IATA BOG (airport) or UNLOCODE COBOG (city) depending on whether it's air or ground freight
- **Informal formats:** Colombian carriers often send rates via WhatsApp screenshots, informal PDFs, or even voice notes
- **Tax complexity:** IVA (19%), retención en la fuente, estampillas — varies by department

**How to build it:**

- Encode Colombian logistics rules as **deterministic business logic**, not just LLM prompts
- Build a DIAN tariff code lookup system
- Implement real-time COP/USD conversion with Central Bank (Banco de la República) rates
- Create a Colombian port surcharge database (updated monthly)
- Add department-level tax calculation logic
- Support informal document formats (WhatsApp image OCR, voice-to-text for rate calls)

**Defensibility:** This is deep domain knowledge that takes years to accumulate. Generic tools like Flexport or Freightos are optimized for US/EU corridors. OperisChain would be the best tool specifically for LatAm freight.

---

### 1.4 Historical Pricing Intelligence

**This is the strongest moat.** After 6 months of operation, OperisChain can tell a broker:

> "Avianca BOG→MIA averaged $2.30/kg last quarter. This new quote at $2.45/kg is **6.5% above your historical average**. However, Q1 rates typically increase 4-8% due to flower season demand. This quote is within normal seasonal range."

No competitor can buy this data. It can only be accumulated organically over time, one uploaded rate document at a time.

**How to build it:**

- **Rate time-series storage:** Every rate gets a `captured_at` timestamp and is never deleted
- **Trend analysis engine:** Calculate moving averages, percentiles, seasonal patterns per route/carrier/mode
- **Anomaly detection:** Flag rates that deviate >15% from historical average with explanations
- **Benchmark reports:** Monthly/quarterly reports showing rate trends per trade lane
- **Negotiation intelligence:** "Your current Maersk rate is in the 80th percentile for this route. 60% of brokers pay less. Consider negotiating."

**Implementation:**

```sql
-- Rate history view
CREATE MATERIALIZED VIEW rate_trends AS
SELECT
  origin, destination, freight_mode, carrier,
  DATE_TRUNC('week', captured_at) AS week,
  AVG(price::numeric) AS avg_price,
  MIN(price::numeric) AS min_price,
  MAX(price::numeric) AS max_price,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price::numeric) AS median_price,
  COUNT(*) AS sample_size
FROM rates
WHERE captured_at > NOW() - INTERVAL '12 months'
GROUP BY origin, destination, freight_mode, carrier, DATE_TRUNC('week', captured_at);
```

**Defensibility:** Time is the ultimate moat. Every day that passes with clients uploading rates, the data advantage compounds exponentially. A competitor launching 6 months later would need 6 months just to reach parity — by which time OperisChain would be 12 months ahead.

---

### 1.5 Workflow Lock-in (Switching Cost)

**What:** Once a broker's team quotes through OperisChain 50+ times per week, switching back to Excel means:

- Re-training the team
- Losing all historical data and trends
- Losing carrier extraction profiles (back to manual copy-paste)
- Losing automated email ingestion
- Losing client-specific markup rules and templates

**How to build it:**

- **Email forwarding:** `rates@company.operischain.com` — brokers forward carrier emails, rates are auto-extracted
- **WhatsApp integration:** Forward a rate screenshot → get a structured quote back in seconds
- **Client templates:** Save per-client markup rules, preferred carriers, default urgency settings
- **CRM integration:** Sync with existing systems (HubSpot, Salesforce, custom ERPs)
- **Quote templates:** Branded PDF exports with company logo, terms & conditions, payment details
- **Keyboard shortcuts and workflows:** Make the daily quoting flow feel effortless

**Defensibility:** Switching costs increase with usage. After 1,000 quotes through OperisChain, the historical data alone makes it irreplaceable.

---

### 1.6 Multi-Modal Knowledge Graph

**What:** Understanding that a shipment from Bogotá to Miami can be fulfilled via multiple modes — and intelligently recommending the optimal one based on the cargo profile:

| Mode                           | Transit    | Cost             | Best for                       |
| ------------------------------ | ---------- | ---------------- | ------------------------------ |
| Air (BOG→MIA)                  | 1-2 days   | $2.45/kg         | Urgent, perishable, high-value |
| Ocean FCL (Buenaventura→Miami) | 14-18 days | $2,850/container | Large volume, non-urgent       |
| Ocean LCL (Buenaventura→Miami) | 18-22 days | $0.15/kg         | Medium volume, cost-sensitive  |
| Ground+Ocean multimodal        | 20-25 days | $0.12/kg         | Lowest cost, no time pressure  |

**How to build it:**

- Cross-reference rates across modes for the same origin-destination pair
- Build a recommendation engine: given cargo weight, urgency, and value, suggest optimal mode
- Create "mode comparison" quotes: single view showing all possible fulfillment options
- Factor in total landed cost: freight + customs + last-mile + insurance + surcharges
- Learn from historical choices: "Brokers on this route choose ocean 70% of the time for cargo >500kg"

**Defensibility:** This requires comprehensive rate data across all modes — something only possible with the data network effect (#1) at scale.

---

## 2. Feature Roadmap

### Phase 1 — Demo to Paid Product (Weeks 1-4)

These features convert OperisChain from a working demo into something brokers will pay for.

#### 🔴 P0: Email Forwarding Ingestion

**Why:** This is the #1 feature brokers want. They already receive rates via email — they just need to forward them.  
**How:** Set up a receiving email address per client (e.g., `rates@company.operischain.com`). Use SendGrid Inbound Parse or AWS SES to receive emails. Extract attachments (PDF, Excel, images), parse the email body, run through the extraction pipeline automatically.  
**Effort:** Medium (2-3 days)  
**Impact:** Eliminates the manual upload step entirely. Brokers don't change their workflow — they just CC or forward.

#### 🔴 P0: Working PDF Export

**Why:** The "Exportar PDF" button exists but isn't wired up. Brokers need to send quotes to their end-clients as professional, branded documents.  
**How:** Use `@react-pdf/renderer` or `puppeteer` to generate PDFs from the quote data. Include: company header, route details, comparative table, recommendation, surcharge notes, terms & conditions, validity dates.  
**Effort:** Small (1 day)  
**Impact:** Completes the core workflow loop: upload → quote → send to client.

#### 🟡 P1: Quote History Dashboard

**Why:** Brokers need to reference past quotes, re-send them, or regenerate with updated rates.  
**How:** The `GET /api/quotes` endpoint already exists. Build a paginated list view with filters (route, carrier, date range, mode). Allow re-opening any past quote in the comparison table.  
**Effort:** Small (1 day)  
**Impact:** Transforms OperisChain from a one-shot tool into a persistent workspace.

#### 🟡 P1: Authentication & Multi-Tenancy

**Why:** Currently using a hardcoded `DEMO_CLIENT_ID`. For production, each company needs its own isolated account.  
**How:** Supabase Auth (email/password + Google OAuth). Row-Level Security (RLS) policies on all tables. Each company gets a `client_id`, all queries filtered by it. Admin users can invite team members.  
**Effort:** Medium (2-3 days)  
**Impact:** Security and isolation — table stakes for paid product.

#### 🟡 P1: Rate Expiration Alerts

**Why:** Rates have `valid_until` dates. When a rate expires, the broker needs to request updated pricing from the carrier.  
**How:** `pg_cron` job or daily Edge Function that checks for rates expiring in the next 7 days. Send email digest and show dashboard notification. Highlight expired rates in red in the quote table.  
**Effort:** Small (1 day)  
**Impact:** Proactive value — the system works for the broker even when they're not using it.

---

### Phase 2 — Sticky Product (Months 2-3)

These features make OperisChain indispensable — hard to switch away from.

#### Price Intelligence & Trends

Historical rate charts per route/carrier. Show how the current quote compares to the 30/60/90-day average. Alert when a rate is significantly above or below market. This is where the data moat starts paying off.

#### WhatsApp Integration

Colombian freight brokers live on WhatsApp. Integration via Twilio or Meta Business API. Broker forwards a carrier's WhatsApp message with a rate screenshot → OperisChain OCRs the image, extracts rates, and responds with a structured quote — all within WhatsApp.

#### Client Management & Margin Calculator

Brokers don't just compare rates — they add their margin before quoting to end-clients. Build per-client profiles with: default markup percentage, preferred carriers, special terms, contact info. Auto-calculate sell rate = buy rate + margin.

#### Carrier Scorecards

Track carrier performance across dimensions: price competitiveness (percentile), rate freshness (how often they update), coverage (routes served), reliability (based on broker feedback). Help brokers choose not just the cheapest, but the best carrier.

#### Bulk Rate Comparison

Upload 10 carrier rate documents at once (common during annual RFQ season). Get one unified comparison table showing all carriers across all routes. Highlight best rate per route, flag missing routes, identify coverage gaps.

---

### Phase 3 — Platform (Months 4-6)

These features transform OperisChain from a tool into a **platform** with network effects.

#### Rate Marketplace (Anonymized Benchmarks)

Opt-in program: clients contribute their rate data (anonymized) to a shared benchmark pool. In return, they see where their rates fall in the market: "Your BOG→MIA air rate is in the 65th percentile — 35% of the market pays less." Revenue model: charge for benchmark access as an add-on.

#### Booking Integration

Connect the quote workflow to actual booking: Quote → Accept → Book → Track. Integrate with carrier APIs where available (Maersk API, airline cargo portals). For carriers without APIs, generate pre-filled booking forms or emails.

#### Customs & Compliance (DIAN Integration)

Automated HS code lookup, restricted goods flagging, DIAN documentation generation. Calculate estimated customs duties and taxes based on cargo classification. This is a massive pain point for Colombian importers/exporters.

#### Team Collaboration

Multiple users per company account. Role-based access: Admin (full access), Quoting (create/view quotes), Viewer (read-only). Quote approval workflows: junior quotes, senior approves. Activity log and audit trail.

#### Public API for ERP/TMS Integration

REST API with API keys so enterprise clients can integrate OperisChain into their existing Transportation Management Systems (TMS) or Enterprise Resource Planning (ERP) software. Webhook notifications for new rates, quote updates, expiring rates.

---

## 3. Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                   │
│                                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Next.js  │  │  WhatsApp    │  │    Email      │  │  Public      │   │
│  │ Web App  │  │  Bot         │  │  Webhook      │  │  REST API    │   │
│  │          │  │  (Twilio/    │  │  (SendGrid    │  │  (API Keys)  │   │
│  │ Dashboard│  │   Meta API)  │  │   Inbound     │  │              │   │
│  │ Quotes   │  │              │  │   Parse)      │  │  For ERP/TMS │   │
│  │ History  │  │  Screenshot  │  │               │  │  integration │   │
│  │ Trends   │  │  → Quote     │  │  Forward      │  │              │   │
│  │ Settings │  │  response    │  │  email →      │  │  GET /rates  │   │
│  │          │  │  in chat     │  │  auto-extract  │  │  POST /quote │   │
│  └────┬─────┘  └──────┬───────┘  └──────┬────────┘  └──────┬───────┘   │
│       │               │                 │                   │           │
└───────┴───────────────┴─────────────────┴───────────────────┴───────────┘
                                │
                    ┌───────────▼────────────┐
                    │     API GATEWAY        │
                    │                        │
                    │  • Authentication      │
                    │    (Supabase Auth)      │
                    │  • Rate Limiting        │
                    │    (per tenant)         │
                    │  • Tenant Isolation     │
                    │    (RLS policies)       │
                    │  • Request Validation   │
                    │  • Usage Metering       │
                    │    (for billing)        │
                    └───────────┬────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
    ┌─────▼─────┐        ┌─────▼─────┐        ┌─────▼─────┐
    │  INGEST   │        │  QUOTES   │        │ INSIGHTS  │
    │  SERVICE  │        │  SERVICE  │        │  SERVICE  │
    │           │        │           │        │           │
    │ • Parse   │        │ • SQL     │        │ • Trends  │
    │   PDF/XLS │        │   Filter  │        │   engine  │
    │   Email   │        │ • Score & │        │ • Anomaly │
    │   Image   │        │   Rank    │        │   detect  │
    │ • LLM     │        │ • LLM     │        │ • Bench-  │
    │   Extract │        │   Reason  │        │   marks   │
    │ • Normal- │        │ • PDF     │        │ • Alerts  │
    │   ize     │        │   Export  │        │   engine  │
    │ • Store   │        │ • Margin  │        │ • Reports │
    │           │        │   calc    │        │           │
    └─────┬─────┘        └─────┬─────┘        └─────┬─────┘
          │                     │                     │
          │              ┌──────▼──────┐              │
          │              │  LLM LAYER  │              │
          │              │             │              │
          │              │ ┌─────────┐ │              │
          │              │ │DeepSeek │ │              │
          │              │ │Extract  │ │              │
          │              │ │(fast,   │ │              │
          │              │ │ cheap)  │ │              │
          │              │ └─────────┘ │              │
          │              │             │              │
          │              │ ┌─────────┐ │              │
          │              │ │ Claude  │ │              │
          │              │ │Reasoning│ │              │
          │              │ │(smart,  │ │              │
          │              │ │accurate)│ │              │
          │              │ └─────────┘ │              │
          │              │             │              │
          │              │ ┌─────────┐ │              │
          │              │ │Fine-    │ │              │
          │              │ │tuned    │ │              │
          │              │ │per-     │ │              │
          │              │ │carrier  │ │              │
          │              │ │(future) │ │              │
          │              │ └─────────┘ │              │
          │              └─────────────┘              │
          │                     │                     │
    ┌─────▼─────────────────────▼─────────────────────▼─────┐
    │                      DATA LAYER                        │
    │                                                        │
    │  ┌───────────────┐  ┌───────────────┐                  │
    │  │   Supabase    │  │   Supabase    │                  │
    │  │   PostgreSQL  │  │   Storage     │                  │
    │  │               │  │   (S3)        │                  │
    │  │  • rates      │  │               │                  │
    │  │  • quotes     │  │  • Original   │                  │
    │  │  • clients    │  │    PDFs       │                  │
    │  │  • documents  │  │  • Excel      │                  │
    │  │  • rate_hist  │  │    files      │                  │
    │  │  • carrier_   │  │  • Email      │                  │
    │  │    profiles   │  │    .eml       │                  │
    │  │  • user_      │  │  • Generated  │                  │
    │  │    feedback   │  │    PDFs       │                  │
    │  │  • benchmarks │  │  • WhatsApp   │                  │
    │  │               │  │    images     │                  │
    │  └───────────────┘  └───────────────┘                  │
    │                                                        │
    │  ┌───────────────┐  ┌───────────────┐                  │
    │  │   Redis       │  │   Supabase    │                  │
    │  │   (Cache)     │  │   Realtime    │                  │
    │  │               │  │               │                  │
    │  │  • Rate       │  │  • Rate       │                  │
    │  │    lookups    │  │    expiry     │                  │
    │  │  • LLM resp   │  │    notifs    │                  │
    │  │    cache      │  │  • Live quote │                  │
    │  │  • Session    │  │    updates   │                  │
    │  │    data       │  │  • New rate   │                  │
    │  │               │  │    alerts    │                  │
    │  └───────────────┘  └───────────────┘                  │
    │                                                        │
    │  ┌─────────────────────────────────────────────┐       │
    │  │          Job Queue (BullMQ / pg_cron)        │       │
    │  │                                             │       │
    │  │  • Async email ingestion                    │       │
    │  │  • Bulk document processing                 │       │
    │  │  • PDF generation                           │       │
    │  │  • Daily rate expiry checks                 │       │
    │  │  • Weekly benchmark recalculations          │       │
    │  │  • Monthly carrier scorecard generation     │       │
    │  └─────────────────────────────────────────────┘       │
    └────────────────────────────────────────────────────────┘
```

---

## 4. Key Architecture Decisions

### 4.1 Compute: Next.js API Routes → Fastify Microservices

| Aspect             | Current (V1)                                                                                                                                   | Target (V2)                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Runtime**        | Next.js API Routes (serverless-like)                                                                                                           | Fastify microservices behind API gateway                                                    |
| **Why change**     | Extraction can take 30-60s. Serverless functions have timeout limits (Vercel: 10s free, 60s pro). Long-running LLM calls block the web server. | Dedicated extraction workers with no timeout. Web server stays fast for dashboard requests. |
| **Migration path** | Keep Next.js for the web app. Move extraction and quote generation to separate Fastify services. Communicate via HTTP or message queue.        |

### 4.2 Async Processing: Synchronous → Queue-Based

| Aspect         | Current (V1)                                                                                                                                                       | Target (V2)                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Flow**       | Upload → wait → result (all synchronous)                                                                                                                           | Upload → queue → webhook/polling → result                                                                                                        |
| **Why change** | Email ingestion can't be synchronous. Bulk uploads of 10+ documents shouldn't block the UI. PDF generation should happen in background.                            | BullMQ + Redis for job queuing. Workers process extraction jobs asynchronously. Frontend polls for status or receives Supabase Realtime updates. |
| **Benefit**    | Handles email forwarding, WhatsApp image processing, bulk uploads, and long extraction jobs gracefully. Users see progress indicators instead of spinning loaders. |

### 4.3 File Storage: Text-Only → Full Document Retention

| Aspect         | Current (V1)                                                                                                                   | Target (V2)                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Storage**    | Raw extracted text stored in `documents.raw_text`                                                                              | Original files in Supabase Storage (S3) + extracted text in DB                                                                                               |
| **Why change** | Original documents are needed for: audit trail, re-extraction with improved models, dispute resolution, compliance.            | Store originals (PDF, Excel, email .eml, images) in Supabase Storage with content-addressable naming. Keep extracted text and structured data in PostgreSQL. |
| **Benefit**    | When extraction models improve, re-process original documents for better accuracy. Legal compliance for freight documentation. |

### 4.4 Auth: Hardcoded → Supabase Auth + RLS

| Aspect         | Current (V1)                                                                                                           | Target (V2)                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Auth**       | `DEMO_CLIENT_ID = "ca99cf7d-..."`                                                                                      | Supabase Auth (email/password + OAuth)           |
| **Isolation**  | None — all data shared                                                                                                 | Row-Level Security (RLS) policies on every table |
| **Why change** | Multi-tenancy is non-negotiable for a SaaS product. Each company must only see their own rates, quotes, and documents. |

**RLS Example:**

```sql
-- rates table: users can only see their own company's rates
CREATE POLICY "Users see own rates"
  ON rates FOR SELECT
  USING (client_id = (SELECT client_id FROM users WHERE id = auth.uid()));
```

### 4.5 LLM Strategy: Single Prompt → Per-Carrier Registry

| Aspect         | Current (V1)                                                                                                                                           | Target (V2)                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| **Extraction** | Single DeepSeek prompt for all carriers                                                                                                                | Carrier-specific prompt registry + fallback                                           |
| **Flow**       | `text → generic_prompt → extracted_rates`                                                                                                              | `text → detect_carrier → carrier_prompt → extracted_rates → validate → feedback_loop` |
| **Why change** | Coordinadora PDFs need different extraction logic than Maersk emails. A generic prompt achieves 80% accuracy; a carrier-specific prompt achieves 95%+. |

**Implementation:**

```typescript
// Carrier prompt registry
const CARRIER_PROMPTS: Record<string, string> = {
  coordinadora: `Extract rates from Coordinadora ground freight document.
    Pricing is in COP. Routes use Colombian city names (not UNLOCODE).
    Look for: Flete, Manejo, Seguro. LTL rates are per-kg with minimum weight.
    FTL rates are per-trip flat rate.`,
  maersk: `Extract rates from Maersk ocean freight document.
    Pricing is in USD. Routes use port UNLOCODE codes.
    Container types: 20GP, 40GP, 40HC. Look for BAF, THC, documentation fees.`,
  default: `Extract freight rates from this document...`,
};
```

### 4.6 Caching: None → Redis

| Aspect         | Current (V1)                                                                                                                                                       | Target (V2)                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| **Caching**    | None — every request hits DB + LLM                                                                                                                                 | Redis for rate lookups, LLM response deduplication |
| **Why change** | Same route quoted 5x in a day = 5 identical LLM calls ($0.05 each). Cache the reasoning for identical inputs. Rate lookups are read-heavy — cache the SQL results. |
| **Savings**    | Estimated 60-70% reduction in LLM costs at scale. Sub-100ms response for cached queries.                                                                           |

### 4.7 Observability: Console.log → Full Stack

| Tool                   | Purpose                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| **Sentry**             | Error tracking, performance monitoring, session replay                                              |
| **PostHog**            | Product analytics: which features are used, user journeys, retention                                |
| **LangSmith**          | LLM observability: trace every extraction/reasoning call, measure accuracy, compare prompt versions |
| **Supabase Dashboard** | Database performance, RLS policy monitoring, storage usage                                          |

---

## 5. Revenue Model

### Tiered SaaS Pricing

| Tier                   | Monthly Price | Extractions | Users     | Features                                                                                               |
| ---------------------- | ------------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------ |
| **Starter**            | $120/mo       | 50/month    | 1         | Manual upload, AI extraction, PDF export, quote history, email support                                 |
| **Professional**       | $349/mo       | 500/month   | 5         | Email forwarding auto-ingestion, WhatsApp Business, price intelligence & rate alerts, priority support |
| **Enterprise**         | $899/mo       | Unlimited   | Unlimited | REST API & webhooks, custom AI model training, ERP/TMS integration, dedicated account manager          |
| **Marketplace Add-on** | +$199/mo      | —           | —         | Anonymized rate benchmarks, market percentiles, lane pricing trends, competitive intelligence          |

### Revenue Projections

| Milestone | Clients                            | Avg Revenue | MRR     | ARR      |
| --------- | ---------------------------------- | ----------- | ------- | -------- |
| Month 1   | 3 Starter                          | $120        | $360    | $4,320   |
| Month 2   | 5 Starter, 2 Pro                   | $180        | $1,260  | $15,120  |
| Month 3   | 7 Starter, 4 Pro                   | $250        | $3,000  | $36,000  |
| Month 6   | 15 Starter, 12 Pro, 3 Enterprise   | $380        | $11,400 | $136,800 |
| Month 12  | 30 Starter, 30 Pro, 10 Enterprise  | $420        | $29,400 | $352,800 |
| Month 18  | 50 Starter, 60 Pro, 20 Enterprise  | $440        | $57,100 | $685,200 |
| Month 24  | 80 Starter, 100 Pro, 35 Enterprise | $450        | $75,950 | $911,400 |

### Unit Economics

| Metric                            | Value                                                                  |
| --------------------------------- | ---------------------------------------------------------------------- |
| **Cost per extraction**           | ~$0.02 (DeepSeek) + ~$0.05 (Claude reasoning) = $0.07                  |
| **Cost per Starter client/mo**    | 50 × $0.07 = $3.50                                                     |
| **Gross margin (Starter)**        | ($120 - $3.50) / $120 = **97.1%**                                      |
| **Cost per Pro client/mo**        | 500 × $0.07 = $35                                                      |
| **Gross margin (Pro)**            | ($349 - $35) / $349 = **90.0%**                                        |
| **Cost per Enterprise client/mo** | ~1000 × $0.07 = $70 (avg)                                              |
| **Gross margin (Enterprise)**     | ($899 - $70) / $899 = **92.2%**                                        |
| **Infrastructure (fixed)**        | ~$50/mo (Supabase Pro) + ~$20/mo (Redis) + ~$30/mo (hosting) = $100/mo |

---

## 6. Current Technical Stack

### What's Built (V1)

| Component          | Technology                                                                            | Status          |
| ------------------ | ------------------------------------------------------------------------------------- | --------------- |
| **Frontend**       | Next.js 14 App Router, TypeScript, Tailwind CSS, TanStack Table v8                    | ✅ Working      |
| **Backend**        | Next.js API Routes (server-side)                                                      | ✅ Working      |
| **Database**       | Supabase PostgreSQL (Session Pooler, IPv4)                                            | ✅ Working      |
| **ORM**            | Drizzle ORM                                                                           | ✅ Working      |
| **LLM Extraction** | DeepSeek Chat (8192 max tokens) via LangChain.js                                      | ✅ Working      |
| **LLM Reasoning**  | Claude Sonnet 4 via LangChain.js                                                      | ✅ Working      |
| **i18n**           | Custom React context (ES/EN), localStorage persistence                                | ✅ Working      |
| **Freight Modes**  | Air, Ocean FCL, Ocean LCL, Ground FTL, Ground LTL, Courier, Multimodal, Rail          | ✅ Schema ready |
| **Extraction**     | PDF, Excel, Email (.eml), raw text                                                    | ✅ Working      |
| **Normalization**  | IATA codes (air), UNLOCODE (ocean/ground), carrier names, location display names      | ✅ Working      |
| **Scoring**        | Multi-factor: price, transit, confidence, surcharges, validity, mode-specific weights | ✅ Working      |
| **Surcharges**     | 14 types with mode-aware defaults and warning system                                  | ✅ Working      |

### Database Schema

```
clients ──┬── documents ──── rates
          │                    │
          └── quotes ──── quote_lines ──┘
```

- **clients:** Company accounts
- **documents:** Uploaded rate documents (text stored, metadata)
- **rates:** Extracted rates (carrier, route, price, mode, surcharges, validity)
- **quotes:** Generated quotes (cargo details, recommendation, reasoning)
- **quote_lines:** Individual rate lines within a quote (price, transit, score)

### Key Enums

- **freightMode:** `air`, `ocean_fcl`, `ocean_lcl`, `ground_ftl`, `ground_ltl`, `courier`, `multimodal`, `rail`
- **containerType:** `20gp`, `40gp`, `40hc`, `20rf`, `40rf`, `20ot`, `40ot`, `20fr`, `40fr`, `45hc`, `na`
- **surchargeType:** `fuel`, `security`, `handling`, `documentation`, `customs`, `insurance`, `storage`, `pickup`, `delivery`, `packaging`, `hazmat`, `oversize`, `peak_season`, `other`

---

## Summary: What Makes OperisChain Defensible

1. **Data compounds over time** — every uploaded rate makes the platform more valuable
2. **LatAm specialization** — deep domain knowledge that generic tools lack
3. **Carrier-specific accuracy** — extraction quality improves with volume per carrier
4. **Historical intelligence** — pricing trends and benchmarks that can't be bought, only earned
5. **Workflow stickiness** — email/WhatsApp integration makes OperisChain the default tool
6. **Multi-modal intelligence** — cross-mode recommendations require comprehensive data

The key insight: **OperisChain's moat is not the technology (LLMs are commoditized) — it's the data**. The extraction pipeline, scoring engine, and recommendation system are necessary but replicable. The accumulated rate data, carrier profiles, and pricing intelligence are not.

**Start accumulating data today. Every day of delay is a day of lost compounding.**
