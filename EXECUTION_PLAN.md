# OperisChain — 6-Month Execution Plan

> Week-by-week roadmap from MVP to market-ready SaaS platform.
> Start date: **Week 1** = Monday after plan approval.

---

## Phase 1: Production-Ready MVP (Weeks 1–4)

**Goal:** Take the working V1 Quote Generator from demo to production-grade with auth, persistence, and export capabilities.

### Week 1 — Authentication & Multi-Tenancy

| Day | Task | Deliverable |
|-----|------|-------------|
| Mon–Tue | Integrate Supabase Auth (email + password) | Login/signup pages, JWT session handling |
| Wed | Implement Row-Level Security (RLS) policies | All tables scoped by `client_id`, RLS enforced at DB level |
| Thu | Multi-tenant middleware + API route guards | `clientId` extracted from session, injected into all queries |
| Fri | Testing & edge cases | Verify data isolation between tenants, error handling |

**Milestone:** Users can register, log in, and only see their own data.

### Week 2 — Quote History & PDF Export

| Day | Task | Deliverable |
|-----|------|-------------|
| Mon | Quote history dashboard page | Paginated list of past quotes with filters (date, mode, origin/dest) |
| Tue | Quote detail view | Full quote breakdown with carrier comparison, re-quote button |
| Wed | PDF export with `@react-pdf/renderer` | Professional branded PDF with logo, quote details, carrier table |
| Thu | PDF template refinement + download/email options | One-click download, copy-to-clipboard formatted quote |
| Fri | Integration testing | End-to-end flow: upload → extract → quote → history → PDF |

**Milestone:** Complete quote lifecycle — generate, review, export, archive.

### Week 3 — Email Forwarding & Auto-Ingestion

| Day | Task | Deliverable |
|-----|------|-------------|
| Mon | Set up SendGrid Inbound Parse webhook | `quotes@operischain.com` receives forwarded carrier emails |
| Tue | Email parser: extract attachments + body text | PDFs, Excel files, and email body extracted and queued |
| Wed | Connect email ingestion to extraction pipeline | Forwarded emails auto-processed through DeepSeek extraction |
| Thu | Notification system (email/in-app) | User notified when quote extraction completes |
| Fri | Error handling & retry logic | Failed extractions queued for retry, admin dashboard for monitoring |

**Milestone:** Users forward carrier emails → quotes appear in dashboard automatically.

### Week 4 — Rate Expiration Alerts & Polish

| Day | Task | Deliverable |
|-----|------|-------------|
| Mon | Rate validity tracking in DB schema | `validFrom`, `validUntil` fields on rates, expiration status |
| Tue | Cron job for expiration scanning | Daily scan flags rates expiring within 7/3/1 days |
| Wed | Alert system (email + in-app notifications) | Users receive alerts for expiring rates with re-quote suggestions |
| Thu | Landing page updates & pricing alignment | SaaS pricing reflected on website, feature lists updated |
| Fri | Phase 1 QA & documentation | API docs, user guide draft, bug fixes |

**Milestone:** Phase 1 complete — production-ready SaaS with auth, history, PDF, email ingestion, alerts.

---

## Phase 2: Intelligence & Integrations (Weeks 5–12)

**Goal:** Add the features that create real switching costs and competitive moats.

### Week 5 — Price Intelligence Engine

| Day | Task | Deliverable |
|-----|------|-------------|
| Mon–Tue | Historical rate storage & indexing | All extracted rates stored with timestamps, carrier, lane, mode |
| Wed–Thu | Rate trend analysis queries | Price-over-time charts per lane, carrier comparison dashboards |
| Fri | Anomaly detection (rate spikes/drops) | Auto-flag unusual pricing with confidence scores |

### Week 6 — Rate Benchmarking Dashboard

| Day | Task | Deliverable |
|-----|------|-------------|
| Mon–Tue | Aggregated market percentile calculations | "Your rate is in the 35th percentile for BOG→MIA air freight" |
| Wed | Visual dashboard with charts (Recharts) | Line charts, bar comparisons, percentile gauges |
| Thu–Fri | Savings opportunity identification | "Carrier X is 15% below your current rate on this lane" |

### Week 7 — WhatsApp Business Integration

| Day | Task | Deliverable |
|-----|------|-------------|
| Mon–Tue | WhatsApp Business API setup (Meta Cloud API) | Business number verified, webhook configured |
| Wed | Inbound message handler | Carrier rate images/PDFs sent via WhatsApp → extraction pipeline |
| Thu | Outbound notifications | Quote ready notifications, rate alert notifications via WhatsApp |
| Fri | Conversation flow & UX polish | Natural language commands: "quote me BOG to MIA 500kg" |

### Week 8 — Document Q&A Module (V1)

| Day | Task | Deliverable |
|-----|------|-------------|
| Mon–Tue | Document upload & vector embedding pipeline | Upload contracts, SOPs → chunked, embedded in Pinecone |
| Wed–Thu | RAG-based Q&A with source citations | "What's the transit time to Miami?" → answer + source doc link |
| Fri | UI: Chat interface with document context | Conversational UI with cited sources, doc previews |

### Week 9 — Multi-Format Ingestion Upgrade

| Day | Task | Deliverable |
|-----|------|-------------|
| Mon–Tue | OCR pipeline for scanned PDFs | Tesseract/Google Vision integration for image-based PDFs |
| Wed | Excel/CSV advanced parsing | Handle complex multi-sheet carrier rate cards |
| Thu–Fri | Carrier template recognition | Auto-detect carrier format, apply correct extraction template |

### Week 10 — Email Triage Module (V1)

| Day | Task | Deliverable |
|-----|------|-------------|
| Mon–Tue | Email classification model | Categorize: quote request, booking confirmation, tracking update, general |
| Wed | Priority scoring & routing rules | Urgent quote requests → immediate notification, routine → queue |
| Thu–Fri | Team routing & assignment | Route to correct team member based on client, lane, mode |

### Week 11 — API & Webhook Layer

| Day | Task | Deliverable |
|-----|------|-------------|
| Mon–Tue | REST API for external integrations | `/api/v1/quotes`, `/api/v1/rates`, `/api/v1/extractions` |
| Wed | API key management & rate limiting | Per-client API keys, usage tracking, rate limits by plan |
| Thu | Webhook system for event notifications | Quote created, rate expiring, extraction complete → webhook |
| Fri | API documentation (Swagger/OpenAPI) | Interactive API docs at `/api/docs` |

### Week 12 — Phase 2 QA & Integration Testing

| Day | Task | Deliverable |
|-----|------|-------------|
| Mon–Tue | End-to-end integration testing | All modules working together, data flowing correctly |
| Wed | Performance optimization | Query optimization, caching, LLM call batching |
| Thu | Security audit | Auth flows, RLS verification, API key rotation, input sanitization |
| Fri | Phase 2 documentation & release notes | Updated user guide, changelog, migration guide |

**Milestone:** Full intelligence platform — price trends, benchmarking, WhatsApp, Doc Q&A, Email Triage, API.

---

## Phase 3: Scale & Marketplace (Weeks 13–24)

**Goal:** Build the marketplace moat, automate onboarding, and prepare for scale.

### Weeks 13–14 — Marketplace Foundation

| Week | Focus | Deliverables |
|------|-------|-------------|
| 13 | Anonymized rate aggregation engine | Data anonymization pipeline, aggregated lane statistics |
| 14 | Marketplace dashboard & percentile rankings | Benchmark UI, lane-level market positioning, trend indicators |

### Weeks 15–16 — Self-Service Onboarding

| Week | Focus | Deliverables |
|------|-------|-------------|
| 15 | Automated signup → workspace provisioning | Stripe billing, auto-provision Supabase schema, welcome flow |
| 16 | Guided onboarding wizard | Step-by-step: connect email → upload first rate sheet → first quote |

### Weeks 17–18 — Compliance Assistant Module

| Week | Focus | Deliverables |
|------|-------|-------------|
| 17 | HS code lookup & DIAN validation | Product description → HS code suggestion with confidence |
| 18 | Customs documentation requirements | Required docs per HS code, VUCE integration status |

### Weeks 19–20 — Advanced Analytics & Reporting

| Week | Focus | Deliverables |
|------|-------|-------------|
| 19 | ROI dashboard | Time saved, quotes generated, cost optimization metrics |
| 20 | Custom report builder | Exportable reports: carrier performance, lane analysis, monthly summaries |

### Weeks 21–22 — ERP/TMS Integration Layer

| Week | Focus | Deliverables |
|------|-------|-------------|
| 21 | Generic TMS connector framework | Pluggable adapter pattern for TMS systems |
| 22 | First TMS integration (Cargowise/Magaya) | Bi-directional sync: quotes → bookings, rate cards → OperisChain |

### Weeks 23–24 — Launch Preparation

| Week | Focus | Deliverables |
|------|-------|-------------|
| 23 | Load testing & infrastructure hardening | Stress test, auto-scaling, monitoring (Sentry, Datadog) |
| 24 | Public launch preparation | Marketing site final, demo videos, case studies, press kit |

**Milestone:** Market-ready platform with marketplace, self-service, compliance, integrations, analytics.

---

## Key Metrics & Targets

### Month 1 (Phase 1)
- [ ] Auth + multi-tenant deployed
- [ ] 3 beta users onboarded
- [ ] 100+ quotes generated through platform
- [ ] PDF export live

### Month 2–3 (Phase 2)
- [ ] Price intelligence dashboard live
- [ ] WhatsApp integration active
- [ ] 10+ paying clients
- [ ] MRR target: $2,000+

### Month 4–6 (Phase 3)
- [ ] Marketplace add-on launched
- [ ] Self-service signup live
- [ ] 25+ paying clients
- [ ] MRR target: $8,000+
- [ ] First TMS integration complete

---

## Revenue Projections

| Month | Clients | Avg Plan | MRR | ARR |
|-------|---------|----------|-----|-----|
| 1 | 3 | $120 (Starter) | $360 | $4,320 |
| 2 | 7 | $180 (mix) | $1,260 | $15,120 |
| 3 | 12 | $250 (mix) | $3,000 | $36,000 |
| 4 | 18 | $300 (mix) | $5,400 | $64,800 |
| 5 | 22 | $350 (mix) | $7,700 | $92,400 |
| 6 | 30 | $380 (mix) | $11,400 | $136,800 |

### Pricing Tiers

| Plan | Price | Target Segment |
|------|-------|----------------|
| **Starter** | $120/mo | Solo operators, small forwarders (1–5 employees) |
| **Professional** | $349/mo | Growing teams (5–20 employees) |
| **Enterprise** | $899/mo | Established forwarders (20–50+ employees) |
| **Marketplace** | +$199/mo | Add-on for any plan, anonymized benchmarking |

---

## Tech Stack Evolution

### Phase 1 (Current → Enhanced)
```
Frontend: Next.js 14 (App Router) + TypeScript
Backend: Next.js API Routes
Database: Supabase PostgreSQL + Drizzle ORM
Auth: Supabase Auth + RLS
LLMs: DeepSeek (extraction) + Claude Sonnet (reasoning)
Email: SendGrid Inbound Parse
PDF: @react-pdf/renderer
```

### Phase 2 (+ Intelligence Layer)
```
+ Vector DB: Pinecone (document embeddings)
+ WhatsApp: Meta Cloud API
+ Caching: Redis (Upstash)
+ Charts: Recharts
+ Cron: Vercel Cron / QStash
+ OCR: Google Cloud Vision
```

### Phase 3 (+ Scale Layer)
```
+ Payments: Stripe
+ Monitoring: Sentry + Datadog
+ CDN: Cloudflare
+ Storage: Cloudflare R2
+ TMS: Adapter framework (Cargowise, Magaya)
+ Analytics: PostHog
```

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM extraction accuracy drops | High | Schema validation, confidence scoring, human-in-the-loop fallback |
| DeepSeek API downtime | Medium | Fallback to Claude for extraction, response caching |
| Slow client adoption | High | Free tier pilot (2 weeks), case studies with ROI proof |
| Carrier format changes | Medium | Template versioning, auto-detection, admin override |
| Data privacy concerns | High | SOC 2 roadmap, data residency options, encryption everywhere |
| Competitor enters LatAm | Medium | Speed to market, network effects from marketplace, deep local knowledge |

---

## Weekly Rituals

- **Monday:** Sprint planning, priority review
- **Wednesday:** Mid-week standup, blocker resolution
- **Friday:** Demo day — show what shipped, update metrics
- **Monthly:** Client feedback review, roadmap adjustment

---

*Document version: 1.0 | Last updated: January 2025*
*Owner: OperisChain Engineering*
