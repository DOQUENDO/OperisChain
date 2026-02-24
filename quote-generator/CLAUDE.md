# OperisChain — Agent Context

## What This Project Is

OperisChain automates document-heavy operational workflows for freight forwarders and logistics brokers in Colombia and LatAm. The first product is a **Quote Generator** that turns messy carrier rate emails into structured, trustworthy quotes.

## Architecture Philosophy

**LLM as reasoning layer. SQL as truth layer. RAG only for unstructured context.**

### The 4 Stages of the Quote Generator

1. **Deterministic Extraction**: Email/PDF/Excel → parse → normalize → INSERT into rates table (PostgreSQL)
2. **SQL Deterministic Filter**: User query → SQL WHERE origin/destination/validity/weight → filtered Rate rows
3. **LLM Reasoning Layer**: Filtered rows → LLM ranks, explains, recommends → Zod validated output
4. **RAG Context Layer**: Vector search for contract notes/exceptions → augments SQL results

## Stack (v1)

- **Runtime**: Node.js 20 LTS + TypeScript (strict)
- **Framework**: Next.js 14 App Router (single repo)
- **Database**: Supabase — PostgreSQL + pgvector + Storage
- **ORM**: Drizzle ORM
- **LLM 1**: DeepSeek Chat (structured extraction — 10x cheaper than GPT-4o, OpenAI-compatible API)
- **LLM 2**: Anthropic Claude Sonnet (reasoning, ranking, recommendations)
- **Chains**: LangChain.js LCEL
- **Validation**: Zod (all LLM outputs MUST be validated)
- **Tracing**: LangSmith (every LLM call traced)
- **UI**: shadcn/ui + Tailwind CSS + TanStack Table

## Non-Negotiable Rules

1. TypeScript strict mode always
2. Every LLM output validated with Zod
3. Every LLM call traced with LangSmith
4. confidence_score on every extraction (0.0-1.0, below 0.7 = review)
5. surcharge_flags explicit — never hide from user
6. Source citation always on every rate line
7. SQL for numbers, RAG for context only
8. null is honest — never guess dates or prices

## Project Structure

```
quote-generator/
├── src/
│   ├── app/
│   │   ├── (dashboard)/quotes/     # Quote Generator UI
│   │   └── api/                    # API Routes (ingest, extract, quotes, rates)
│   ├── lib/
│   │   ├── extraction/             # Parsers + normalizers
│   │   ├── chains/                 # LangChain extraction + quote chains
│   │   ├── db/                     # Drizzle schema + queries
│   │   ├── scoring.ts              # Deterministic rate scoring
│   │   └── surcharges.ts           # Surcharge flag system
│   └── components/                 # React UI components
├── drizzle/                        # Migrations
└── drizzle.config.ts
```

## Build Order

Week 1: extraction/ — parsers + normalizer + rate-extractor + schema
Week 2: db/queries.ts + scoring.ts + surcharges.ts
Week 3: chains/ — extract.chain.ts + quote.chain.ts + LangSmith
Week 4: components/ + dashboard pages + PDF export
Week 5: Real client data test
Week 6: Polish + deploy

## What NOT to Build (v1)

❌ Email triage module
❌ Document Q&A chat
❌ Compliance / HS code assistant
❌ Multi-tenant admin dashboard
❌ Billing / Stripe integration
