/* ═══════════════════════════════════════════════════════
   OperisChain — i18n (English/Spanish) Translation System
   ═══════════════════════════════════════════════════════ */

const translations = {
  en: {
    // Nav
    "nav.problem": "Problem",
    "nav.modules": "Modules",
    "nav.how": "How It Works",
    "nav.why": "Why Us",
    "nav.pricing": "Pricing",
    "nav.faq": "FAQ",
    "nav.cta": "Book a Demo →",

    // Hero
    "hero.badge": "Built for LatAm Freight Forwarders",
    "hero.title.1": "Your Operations Team,",
    "hero.title.2": "Supercharged by AI",
    "hero.subtitle":
      "OperisChain automates the document-heavy workflows draining your freight forwarding team — quotation generation, document search, email triage, and customs compliance. Reduce operational overhead by 30%.",
    "hero.cta.primary": "Book a Demo",
    "hero.cta.secondary": "Explore Modules",
    "hero.stat1.label": "Overhead Reduced",
    "hero.stat2.label": "Automation Modules",
    "hero.stat3.label": "To Deployment",
    "hero.badge.modules": "4 modules deployed",
    "hero.badge.ai": "AI-powered",

    // Problem
    "problem.label": "The Problem",
    "problem.title.1": "Your Team Spends 60% of Their Day",
    "problem.title.2": "On Repetitive Document Work",
    "problem.subtitle":
      "Mid-market freight forwarders in LatAm face a universal problem: highly skilled operators buried in manual processes from the last century. Enterprise solutions target the US and Europe — your market is completely underserved.",
    "problem.card1.title": "Quotations Built by Hand",
    "problem.card1.text":
      "Your team reads 10+ carrier emails, extracts rates from broken tables and PDFs, and manually builds comparison spreadsheets — every single time.",
    "problem.card2.title": "Lost Knowledge in Folders",
    "problem.card2.text":
      "Contracts, SOPs, rate sheets — scattered across email, drives, and desktops. The answer exists somewhere, but finding it takes longer than guessing.",
    "problem.card3.title": "Email Overload",
    "problem.card3.text":
      "Urgent quote requests buried under confirmations, follow-ups, and spam. Operators miss critical emails because there's no intelligent prioritization.",
    "problem.card4.title": "Compliance Nightmares",
    "problem.card4.text":
      "HS codes searched manually, DIAN regulations checked by memory, and customs documents prepared hoping nothing was missed. One error = costly delays.",

    // Modules
    "modules.label": "Platform Modules",
    "modules.title.1": "Four Modules. ",
    "modules.title.2": "One Platform.",
    "modules.subtitle":
      "Each module targets the most time-consuming workflows in freight forwarding operations. Deploy them individually or as a complete suite.",
    "mod1.tag": "Highest Impact",
    "mod1.title": "Quote Generator",
    "mod1.desc":
      "Upload 5–10 carrier emails and get a structured, comparative quotation in seconds. Parsed, validated, and ready to send to your client.",
    "mod1.f1": "Multi-format ingestion (PDF, Excel, email)",
    "mod1.f2": "AI-ranked carrier recommendations",
    "mod1.f3": "Export to PDF or clipboard",
    "mod1.flow.from": "Carrier Emails",
    "mod1.flow.to": "Structured Quote",
    "mod2.tag": "Time Saver",
    "mod2.title": "Document Q&A",
    "mod2.desc":
      "Ask questions in natural language and get instant answers from your contracts, SOPs, and rate sheets — with source citations always included.",
    "mod2.f1": "Natural language search",
    "mod2.f2": "Source citations on every answer",
    "mod2.f3": "Contracts, SOPs, rate sheets, guides",
    "mod2.flow.from": '"Transit time to MIA?"',
    "mod2.flow.to": "Answer + Source",
    "mod3.tag": "Automation",
    "mod3.title": "Email Triage",
    "mod3.desc":
      "Incoming emails are automatically classified, prioritized, and routed to the right person. Never miss an urgent quote request again.",
    "mod3.f1": "Auto-classify by type & urgency",
    "mod3.f2": "Intelligent routing to team members",
    "mod3.f3": "Gmail & IMAP integration",
    "mod3.flow.from": "Inbox Chaos",
    "mod3.flow.to": "Prioritized Queue",
    "mod4.tag": "Compliance",
    "mod4.title": "Compliance Assistant",
    "mod4.desc":
      "Describe a product in plain language and get the correct HS code, DIAN validation, and customs documentation requirements — instantly.",
    "mod4.f1": "HS code lookup from descriptions",
    "mod4.f2": "DIAN & VUCE regulation validation",
    "mod4.f3": "Colombian customs compliance",
    "mod4.flow.from": '"LED displays 42in"',
    "mod4.flow.to": "HS: 8528.72 ✓",

    // Pipeline
    "pipeline.label": "How It Works",
    "pipeline.title.1": "Six Layers. ",
    "pipeline.title.2": "One Intelligent System.",
    "pipeline.subtitle":
      "OperisChain's architecture is purpose-built for document-heavy logistics workflows — from ingestion to AI reasoning to action.",
    "pipe1.title": "Document Ingestion",
    "pipe1.text":
      "PDFs, Excel, emails, Word docs — all formats accepted. Connected to Gmail/IMAP for automatic ingestion.",
    "pipe1.tag": "Multi-format",
    "pipe2.title": "Processing & Embedding",
    "pipe2.text":
      "Documents are chunked, embedded, and enriched with metadata — type, client, carrier, route, date.",
    "pipe2.tag": "AI embeddings",
    "pipe3.title": "Intelligent Storage",
    "pipe3.text":
      "Vector DB for semantic search, PostgreSQL for structured data, Redis for caching. Each with a clear responsibility.",
    "pipe3.tag": "Hybrid storage",
    "pipe4.title": "LLM Orchestration",
    "pipe4.text":
      "GPT-4o for generation, Claude for complex analysis. Every output validated with schemas. Every call traced.",
    "pipe4.tag": "Multi-model",
    "pipe5.title": "Workflow Automation",
    "pipe5.text":
      "The 4 modules execute on the orchestration layer — quoting, search, triage, compliance. All automated.",
    "pipe5.tag": "4 modules",
    "pipe6.title": "Interfaces",
    "pipe6.text":
      "Dashboard, chat, API, webhooks. Your team interacts through a modern UI. Your systems integrate via REST.",
    "pipe6.tag": "Multi-channel",

    // Features
    "features.label": "Capabilities",
    "features.title.1": "Built for ",
    "features.title.2": "Operational Trust",
    "features.subtitle":
      "Every capability exists to make your operators trust the system enough to act on its output without double-checking.",
    "feat1.title": "Source Citations Always",
    "feat1.text":
      "Every answer, every rate, every recommendation links back to the original document. Full auditability on every output.",
    "feat2.title": "Data Isolation",
    "feat2.text":
      "Every record is scoped by client. Your rates, documents, and quotes are completely invisible to other clients. Row-level security enforced.",
    "feat3.title": "LatAm-Native",
    "feat3.text":
      "Built for the Colombian and Latin American freight market. DIAN integration, VUCE compliance, Spanish-fluent AI, local carrier knowledge.",
    "feat4.title": "Validated AI Outputs",
    "feat4.text":
      "Every LLM output is validated against strict schemas before reaching your team. Bad data is caught and flagged — never silently passed.",
    "feat5.title": "Real-Time Dashboard",
    "feat5.text":
      "Usage metrics, cost tracking, time savings — all visible in real-time. See your ROI calculation update with every automated workflow.",
    "feat6.title": "API & Webhook Ready",
    "feat6.text":
      "REST endpoints for TMS integration, webhook notifications to Slack and WhatsApp Business. OperisChain fits into your existing stack.",

    // Why Us
    "why.label": "Why OperisChain",
    "why.title.1": "The Enterprise Tools",
    "why.title.2": "Ignore Your Market",
    "why.subtitle":
      "Enterprise logistics platforms target US and European carriers with 6-month onboarding and annual contracts. OperisChain is purpose-built for LatAm mid-market freight forwarders.",
    "why.item1.title": "Deployed in Weeks, Not Months",
    "why.item1.text":
      "Full implementation takes 3 weeks with your real data. Not 6 months of enterprise onboarding.",
    "why.item2.title": "Your Data, Not Generic Models",
    "why.item2.text":
      "The system trains on your actual carrier emails, contracts, and SOPs. It knows your business, not a generic freight model.",
    "why.item3.title": "Mid-Market SaaS Pricing",
    "why.item3.text":
      "From $120/mo with a free trial. No enterprise sales cycles, no annual lock-in. Prove ROI in 14 days before you pay.",
    "why.item4.title": "No Market Competition",
    "why.item4.text":
      "No AI operations tool targets 5–50 employee freight forwarders in LatAm. This market is completely underserved — until now.",

    // Pricing
    "pricing.label": "Pricing",
    "pricing.title.1": "Simple Pricing. ",
    "pricing.title.2": "Serious Results.",
    "pricing.subtitle":
      "Start with a 14-day free trial. No credit card required. Scale as your operations grow.",
    "pricing.period": "/month",
    "pricing.popular": "Most Popular",
    "pricing.includes": "Everything in Starter, plus:",
    "pricing.includes.enterprise": "Everything in Professional, plus:",
    "price1.label": "Getting Started",
    "price1.name": "Starter",
    "price1.desc":
      "Perfect for solo operators and small forwarders. Upload carrier rate sheets and get structured quotes in seconds.",
    "price1.f1": "Manual file upload (PDF, Excel, email)",
    "price1.f2": "AI-powered quote extraction",
    "price1.f3": "Up to 50 extractions/month",
    "price1.f4": "PDF export & quote history",
    "price1.f5": "1 user seat",
    "price1.f6": "Email support",
    "price1.btn": "Book a Demo",
    "price2.label": "Best Value",
    "price2.name": "Professional",
    "price2.desc":
      "For growing teams. Automate email ingestion, get price intelligence, and scale your quoting operations.",
    "price2.f1": "Email forwarding auto-ingestion",
    "price2.f2": "WhatsApp Business integration",
    "price2.f3": "Price intelligence & rate alerts",
    "price2.f4": "Up to 500 extractions/month",
    "price2.f5": "5 user seats",
    "price2.f6": "Priority support",
    "price2.btn": "Book a Demo →",
    "price3.label": "Full Power",
    "price3.name": "Enterprise",
    "price3.desc":
      "Unlimited power for established forwarders. API access, custom models, ERP integration, and dedicated support.",
    "price3.f1": "Unlimited extractions",
    "price3.f2": "Unlimited user seats",
    "price3.f3": "REST API & webhook access",
    "price3.f4": "Custom AI model training",
    "price3.f5": "ERP/TMS integration",
    "price3.f6": "Dedicated account manager",
    "price3.btn": "Book a Demo",
    "price4.tag": "Add-on",
    "price4.name": "Marketplace Intelligence",
    "price4.desc":
      "Anonymized rate benchmarking across the OperisChain network. Know where your rates stand in the market.",
    "price4.f1": "Rate benchmarking",
    "price4.f2": "Market percentiles",
    "price4.f3": "Lane pricing trends",
    "price4.f4": "Competitive intelligence",

    // FAQ
    "faq.label": "FAQ",
    "faq.title.1": "Common ",
    "faq.title.2": "Questions",
    "faq.subtitle": "Everything you need to know about OperisChain.",
    "faq1.q": "Do I need all 4 modules or can I start with just one?",
    "faq1.a":
      "You can deploy modules individually. Most clients start with the Quote Generator — it has the highest immediate impact and demonstrates ROI fastest. During the audit, we identify which modules will save your team the most time and recommend a deployment order.",
    "faq2.q": "How is this different from just using ChatGPT?",
    "faq2.a":
      "ChatGPT is a general tool — it doesn't know your carriers, your contracts, or your compliance requirements. OperisChain is trained on your actual data, validates every output against strict schemas, cites sources, and integrates directly into your workflow. It's a purpose-built system, not a general chatbot.",
    "faq3.q": "What document formats does it support?",
    "faq3.a":
      "PDFs, Excel/CSV, Word documents, plain text, emails (via Gmail API or IMAP), and even scanned documents via OCR. During implementation, we configure extraction pipelines specifically for your carriers' formats for maximum accuracy.",
    "faq4.q": "How long does the full implementation take?",
    "faq4.a":
      "The audit takes about a week. Full implementation with all modules takes approximately 3 weeks after that — ingestion pipelines, AI configuration, dashboard setup, integrations, and team training. Compare that to 6+ months with enterprise solutions.",
    "faq5.q": "Is my data secure?",
    "faq5.a":
      "Yes. Every record is scoped by client ID with row-level security enforced at the database level. Your data is stored in isolated indexes. We use Supabase (PostgreSQL), Pinecone (vector DB), and Cloudflare R2 (file storage) — all with encryption at rest and in transit.",
    "faq6.q": "Can it integrate with our existing TMS or systems?",
    "faq6.a":
      "Yes. OperisChain provides REST API endpoints for integration with external TMS systems, plus webhook notifications to Slack and WhatsApp Business. During implementation, we configure the integrations specific to your tech stack.",

    // CTA
    "cta.title.1": "Ready to Automate Your",
    "cta.title.2": "Freight Operations?",
    "cta.text":
      "Automate your quotes now with your real freight data. Book a personalized demo and discover how AI can transform your quoting operations.",
    "cta.primary": "Book a Demo →",
    "cta.secondary": "Explore Modules",

    // Footer
    "footer.desc":
      "AI-powered operational automation for freight forwarders in Latin America. Reduce overhead, eliminate errors, scale with confidence.",
    "footer.platform": "Platform",
    "footer.modules": "Modules",
    "footer.architecture": "Architecture",
    "footer.capabilities": "Capabilities",
    "footer.pricing": "Pricing",
    "footer.company": "Company",
    "footer.about": "About",
    "footer.blog": "Blog",
    "footer.careers": "Careers",
    "footer.contact": "Contact",
    "footer.legal": "Legal",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",
    "footer.data": "Data Processing",
    "footer.copy": "© 2026 OperisChain. All rights reserved.",

    // Demo Modal
    "demo.title": "Book a Demo",
    "demo.subtitle":
      "Automate your quotes now with a personalized walkthrough using your real freight data.",
    "demo.name": "Full Name",
    "demo.email": "Work Email",
    "demo.company": "Company",
    "demo.size": "Team Size",
    "demo.size.placeholder": "Select...",
    "demo.size.1": "1–5 employees",
    "demo.size.2": "5–20 employees",
    "demo.size.3": "20–50 employees",
    "demo.size.4": "50+ employees",
    "demo.phone": "Phone",
    "demo.message": "What are you looking to automate?",
    "demo.error.name": "Please enter your full name",
    "demo.error.email": "Please enter a valid work email",
    "demo.error.company": "Please enter your company name",
    "demo.error.size": "Please select your team size",
    "demo.error.phone": "Please enter a valid phone number",
    "demo.error.message": "Please describe what you'd like to automate (min. 10 characters)",
    "demo.submit": "Book My Demo",
    "demo.success.title": "Demo Booked!",
    "demo.success.text":
      "Thanks! We'll reach out within 24 hours to schedule your personalized demo. Check your inbox.",
    "demo.success.close": "Got it",
  },

  es: {
    // Nav
    "nav.problem": "Problema",
    "nav.modules": "Módulos",
    "nav.how": "Cómo Funciona",
    "nav.why": "Por Qué",
    "nav.pricing": "Precios",
    "nav.faq": "FAQ",
    "nav.cta": "Agendar Demo →",

    // Hero
    "hero.badge": "Hecho para Freight Forwarders en LatAm",
    "hero.title.1": "Tu Equipo de Operaciones,",
    "hero.title.2": "Potenciado con IA",
    "hero.subtitle":
      "OperisChain automatiza los flujos documentales que drenan a tu equipo de logística — generación de cotizaciones, búsqueda de documentos, triaje de correos y cumplimiento aduanero. Reduce el overhead operativo en un 30%.",
    "hero.cta.primary": "Agendar Demo",
    "hero.cta.secondary": "Explorar Módulos",
    "hero.stat1.label": "Overhead Reducido",
    "hero.stat2.label": "Módulos de Automatización",
    "hero.stat3.label": "Al Despliegue",
    "hero.badge.modules": "4 módulos desplegados",
    "hero.badge.ai": "Impulsado por IA",

    // Problem
    "problem.label": "El Problema",
    "problem.title.1": "Tu Equipo Gasta el 60% de su Día",
    "problem.title.2": "En Trabajo Documental Repetitivo",
    "problem.subtitle":
      "Los freight forwarders medianos en LatAm enfrentan un problema universal: operadores altamente calificados enterrados en procesos manuales del siglo pasado. Las soluciones enterprise apuntan a EE.UU. y Europa — tu mercado está completamente desatendido.",
    "problem.card1.title": "Cotizaciones Hechas a Mano",
    "problem.card1.text":
      "Tu equipo lee 10+ correos de carriers, extrae tarifas de tablas rotas y PDFs, y arma hojas de comparación manualmente — cada vez.",
    "problem.card2.title": "Conocimiento Perdido en Carpetas",
    "problem.card2.text":
      "Contratos, SOPs, tarifarios — dispersos entre correo, drives y escritorios. La respuesta existe en algún lugar, pero encontrarla toma más que adivinar.",
    "problem.card3.title": "Sobrecarga de Correo",
    "problem.card3.text":
      "Solicitudes urgentes de cotización enterradas bajo confirmaciones, seguimientos y spam. Los operadores pierden correos críticos porque no hay priorización inteligente.",
    "problem.card4.title": "Pesadillas de Cumplimiento",
    "problem.card4.text":
      "Códigos HS buscados manualmente, regulaciones DIAN verificadas de memoria, y documentos aduaneros preparados esperando no haber omitido nada. Un error = retrasos costosos.",

    // Modules
    "modules.label": "Módulos de la Plataforma",
    "modules.title.1": "Cuatro Módulos. ",
    "modules.title.2": "Una Plataforma.",
    "modules.subtitle":
      "Cada módulo apunta a los flujos más costosos en tiempo dentro de las operaciones de freight forwarding. Despliégalos individualmente o como suite completa.",
    "mod1.tag": "Mayor Impacto",
    "mod1.title": "Generador de Cotizaciones",
    "mod1.desc":
      "Sube 5–10 correos de carriers y obtén una cotización estructurada y comparativa en segundos. Parseada, validada y lista para enviar a tu cliente.",
    "mod1.f1": "Ingesta multi-formato (PDF, Excel, correo)",
    "mod1.f2": "Recomendaciones de carriers con IA",
    "mod1.f3": "Exportar a PDF o portapapeles",
    "mod1.flow.from": "Correos de Carriers",
    "mod1.flow.to": "Cotización Estructurada",
    "mod2.tag": "Ahorra Tiempo",
    "mod2.title": "Preguntas sobre Documentos",
    "mod2.desc":
      "Haz preguntas en lenguaje natural y obtén respuestas instantáneas de tus contratos, SOPs y tarifarios — siempre con citas de fuentes incluidas.",
    "mod2.f1": "Búsqueda en lenguaje natural",
    "mod2.f2": "Citas de fuente en cada respuesta",
    "mod2.f3": "Contratos, SOPs, tarifarios, guías",
    "mod2.flow.from": '"¿Tiempo tránsito a MIA?"',
    "mod2.flow.to": "Respuesta + Fuente",
    "mod3.tag": "Automatización",
    "mod3.title": "Triaje de Correos",
    "mod3.desc":
      "Los correos entrantes se clasifican, priorizan y enrutan automáticamente a la persona correcta. Nunca pierdas una solicitud urgente de cotización.",
    "mod3.f1": "Auto-clasificar por tipo y urgencia",
    "mod3.f2": "Enrutamiento inteligente al equipo",
    "mod3.f3": "Integración Gmail e IMAP",
    "mod3.flow.from": "Caos en la Bandeja",
    "mod3.flow.to": "Cola Priorizada",
    "mod4.tag": "Cumplimiento",
    "mod4.title": "Asistente de Cumplimiento",
    "mod4.desc":
      "Describe un producto en lenguaje sencillo y obtén el código HS correcto, validación DIAN y requisitos de documentación aduanera — al instante.",
    "mod4.f1": "Búsqueda de códigos HS por descripción",
    "mod4.f2": "Validación regulatoria DIAN y VUCE",
    "mod4.f3": "Cumplimiento aduanero colombiano",
    "mod4.flow.from": '"Pantallas LED 42in"',
    "mod4.flow.to": "HS: 8528.72 ✓",

    // Pipeline
    "pipeline.label": "Cómo Funciona",
    "pipeline.title.1": "Seis Capas. ",
    "pipeline.title.2": "Un Sistema Inteligente.",
    "pipeline.subtitle":
      "La arquitectura de OperisChain está diseñada para flujos logísticos con alto volumen documental — desde la ingesta hasta el razonamiento con IA.",
    "pipe1.title": "Ingesta de Documentos",
    "pipe1.text":
      "PDFs, Excel, correos, Word — todos los formatos aceptados. Conectado a Gmail/IMAP para ingesta automática.",
    "pipe1.tag": "Multi-formato",
    "pipe2.title": "Procesamiento y Embedding",
    "pipe2.text":
      "Los documentos se fragmentan, embeben y enriquecen con metadata — tipo, cliente, carrier, ruta, fecha.",
    "pipe2.tag": "Embeddings IA",
    "pipe3.title": "Almacenamiento Inteligente",
    "pipe3.text":
      "Vector DB para búsqueda semántica, PostgreSQL para datos estructurados, Redis para caché. Cada uno con una responsabilidad clara.",
    "pipe3.tag": "Almacenamiento híbrido",
    "pipe4.title": "Orquestación LLM",
    "pipe4.text":
      "GPT-4o para generación, Claude para análisis complejo. Cada output validado con schemas. Cada llamada trazada.",
    "pipe4.tag": "Multi-modelo",
    "pipe5.title": "Automatización de Flujos",
    "pipe5.text":
      "Los 4 módulos ejecutan sobre la capa de orquestación — cotización, búsqueda, triaje, cumplimiento. Todo automatizado.",
    "pipe5.tag": "4 módulos",
    "pipe6.title": "Interfaces",
    "pipe6.text":
      "Dashboard, chat, API, webhooks. Tu equipo interactúa a través de una UI moderna. Tus sistemas se integran vía REST.",
    "pipe6.tag": "Multi-canal",

    // Features
    "features.label": "Capacidades",
    "features.title.1": "Construido para la ",
    "features.title.2": "Confianza Operativa",
    "features.subtitle":
      "Cada capacidad existe para que tus operadores confíen en el sistema lo suficiente como para actuar sin verificar manualmente.",
    "feat1.title": "Citas de Fuente Siempre",
    "feat1.text":
      "Cada respuesta, cada tarifa, cada recomendación enlaza al documento original. Auditabilidad completa en cada output.",
    "feat2.title": "Aislamiento de Datos",
    "feat2.text":
      "Cada registro está delimitado por cliente. Tus tarifas, documentos y cotizaciones son completamente invisibles para otros clientes. Seguridad a nivel de fila.",
    "feat3.title": "Nativo para LatAm",
    "feat3.text":
      "Construido para el mercado de carga colombiano y latinoamericano. Integración DIAN, cumplimiento VUCE, IA fluida en español, conocimiento local de carriers.",
    "feat4.title": "Outputs de IA Validados",
    "feat4.text":
      "Cada output del LLM se valida contra schemas estrictos antes de llegar a tu equipo. Los datos erróneos se capturan y señalan — nunca pasan silenciosamente.",
    "feat5.title": "Dashboard en Tiempo Real",
    "feat5.text":
      "Métricas de uso, seguimiento de costos, ahorro de tiempo — todo visible en tiempo real. Ve cómo tu cálculo de ROI se actualiza con cada flujo automatizado.",
    "feat6.title": "API y Webhooks Listos",
    "feat6.text":
      "Endpoints REST para integración con TMS, notificaciones webhook a Slack y WhatsApp Business. OperisChain se integra con tu stack existente.",

    // Why Us
    "why.label": "Por Qué OperisChain",
    "why.title.1": "Las Herramientas Enterprise",
    "why.title.2": "Ignoran Tu Mercado",
    "why.subtitle":
      "Las plataformas logísticas enterprise apuntan a carriers de EE.UU. y Europa con onboarding de 6 meses y contratos anuales. OperisChain está diseñado para freight forwarders mid-market en LatAm.",
    "why.item1.title": "Desplegado en Semanas, No Meses",
    "why.item1.text":
      "La implementación completa toma 3 semanas con tus datos reales. No 6 meses de onboarding enterprise.",
    "why.item2.title": "Tus Datos, No Modelos Genéricos",
    "why.item2.text":
      "El sistema se entrena con tus correos reales de carriers, contratos y SOPs. Conoce tu negocio, no un modelo genérico de carga.",
    "why.item3.title": "Precios SaaS Mid-Market",
    "why.item3.text":
      "Desde $120/mes con prueba gratuita. Sin ciclos de venta enterprise, sin contratos anuales. Demuestra ROI en 14 días antes de pagar.",
    "why.item4.title": "Sin Competencia en el Mercado",
    "why.item4.text":
      "Ninguna herramienta de operaciones con IA apunta a freight forwarders de 5–50 empleados en LatAm. Este mercado está completamente desatendido — hasta ahora.",

    // Pricing
    "pricing.label": "Precios",
    "pricing.title.1": "Precios Simples. ",
    "pricing.title.2": "Resultados Serios.",
    "pricing.subtitle":
      "Comienza con una prueba gratuita de 14 días. Sin tarjeta de crédito. Escala a medida que crecen tus operaciones.",
    "pricing.period": "/mes",
    "pricing.popular": "Más Popular",
    "pricing.includes": "Todo lo de Starter, más:",
    "pricing.includes.enterprise": "Todo lo de Professional, más:",
    "price1.label": "Para Empezar",
    "price1.name": "Starter",
    "price1.desc":
      "Perfecto para operadores independientes y forwarders pequeños. Sube tarifarios de carriers y obtén cotizaciones estructuradas en segundos.",
    "price1.f1": "Carga manual de archivos (PDF, Excel, correo)",
    "price1.f2": "Extracción de cotizaciones con IA",
    "price1.f3": "Hasta 50 extracciones/mes",
    "price1.f4": "Exportar a PDF e historial de cotizaciones",
    "price1.f5": "1 usuario",
    "price1.f6": "Soporte por correo",
    "price1.btn": "Agendar Demo",
    "price2.label": "Mejor Valor",
    "price2.name": "Professional",
    "price2.desc":
      "Para equipos en crecimiento. Automatiza la ingesta de correos, obtén inteligencia de precios y escala tus operaciones de cotización.",
    "price2.f1": "Auto-ingesta por reenvío de correo",
    "price2.f2": "Integración WhatsApp Business",
    "price2.f3": "Inteligencia de precios y alertas de tarifas",
    "price2.f4": "Hasta 500 extracciones/mes",
    "price2.f5": "5 usuarios",
    "price2.f6": "Soporte prioritario",
    "price2.btn": "Agendar Demo →",
    "price3.label": "Máximo Poder",
    "price3.name": "Enterprise",
    "price3.desc":
      "Poder ilimitado para forwarders establecidos. Acceso API, modelos personalizados, integración ERP y soporte dedicado.",
    "price3.f1": "Extracciones ilimitadas",
    "price3.f2": "Usuarios ilimitados",
    "price3.f3": "Acceso a REST API y webhooks",
    "price3.f4": "Entrenamiento de modelo IA personalizado",
    "price3.f5": "Integración ERP/TMS",
    "price3.f6": "Account manager dedicado",
    "price3.btn": "Agendar Demo",
    "price4.tag": "Complemento",
    "price4.name": "Inteligencia de Mercado",
    "price4.desc":
      "Benchmarking de tarifas anonimizado en la red OperisChain. Conoce dónde están tus tarifas en el mercado.",
    "price4.f1": "Benchmarking de tarifas",
    "price4.f2": "Percentiles de mercado",
    "price4.f3": "Tendencias de precios por ruta",
    "price4.f4": "Inteligencia competitiva",

    // FAQ
    "faq.label": "FAQ",
    "faq.title.1": "Preguntas ",
    "faq.title.2": "Frecuentes",
    "faq.subtitle": "Todo lo que necesitas saber sobre OperisChain.",
    "faq1.q": "¿Necesito los 4 módulos o puedo empezar con uno solo?",
    "faq1.a":
      "Puedes desplegar módulos individualmente. La mayoría de clientes empiezan con el Generador de Cotizaciones — tiene el mayor impacto inmediato y demuestra ROI más rápido. Durante la auditoría, identificamos cuáles módulos ahorrarán más tiempo a tu equipo y recomendamos un orden de despliegue.",
    "faq2.q": "¿En qué se diferencia de solo usar ChatGPT?",
    "faq2.a":
      "ChatGPT es una herramienta general — no conoce tus carriers, tus contratos ni tus requisitos de cumplimiento. OperisChain se entrena con tus datos reales, valida cada output contra schemas estrictos, cita fuentes y se integra directamente en tu flujo de trabajo. Es un sistema construido a medida, no un chatbot general.",
    "faq3.q": "¿Qué formatos de documentos soporta?",
    "faq3.a":
      "PDFs, Excel/CSV, documentos Word, texto plano, correos (vía Gmail API o IMAP), e incluso documentos escaneados vía OCR. Durante la implementación, configuramos pipelines de extracción específicos para los formatos de tus carriers para máxima precisión.",
    "faq4.q": "¿Cuánto toma la implementación completa?",
    "faq4.a":
      "La auditoría toma aproximadamente una semana. La implementación completa con todos los módulos toma aproximadamente 3 semanas después — pipelines de ingesta, configuración de IA, setup del dashboard, integraciones y capacitación del equipo. Compara eso con 6+ meses de soluciones enterprise.",
    "faq5.q": "¿Mis datos están seguros?",
    "faq5.a":
      "Sí. Cada registro está delimitado por ID de cliente con seguridad a nivel de fila impuesta a nivel de base de datos. Tus datos se almacenan en índices aislados. Usamos Supabase (PostgreSQL), Pinecone (vector DB) y Cloudflare R2 (almacenamiento de archivos) — todo con cifrado en reposo y en tránsito.",
    "faq6.q": "¿Se puede integrar con nuestro TMS o sistemas existentes?",
    "faq6.a":
      "Sí. OperisChain proporciona endpoints REST API para integración con sistemas TMS externos, además de notificaciones webhook a Slack y WhatsApp Business. Durante la implementación, configuramos las integraciones específicas para tu stack tecnológico.",

    // CTA
    "cta.title.1": "¿Listo para Automatizar Tus",
    "cta.title.2": "Operaciones de Carga?",
    "cta.text":
      "Automatiza tus cotizaciones hoy con tus datos reales de carga. Agenda una demo personalizada y descubre cómo la IA puede transformar tus operaciones de cotización.",
    "cta.primary": "Agendar Demo →",
    "cta.secondary": "Explorar Módulos",

    // Footer
    "footer.desc":
      "Automatización operativa impulsada por IA para freight forwarders en América Latina. Reduce el overhead, elimina errores, escala con confianza.",
    "footer.platform": "Plataforma",
    "footer.modules": "Módulos",
    "footer.architecture": "Arquitectura",
    "footer.capabilities": "Capacidades",
    "footer.pricing": "Precios",
    "footer.company": "Empresa",
    "footer.about": "Nosotros",
    "footer.blog": "Blog",
    "footer.careers": "Carreras",
    "footer.contact": "Contacto",
    "footer.legal": "Legal",
    "footer.privacy": "Política de Privacidad",
    "footer.terms": "Términos de Servicio",
    "footer.data": "Procesamiento de Datos",
    "footer.copy": "© 2026 OperisChain. Todos los derechos reservados.",

    // Demo Modal
    "demo.title": "Agendar Demo",
    "demo.subtitle":
      "Automatiza tus cotizaciones hoy con un recorrido personalizado usando tus datos reales de carga.",
    "demo.name": "Nombre Completo",
    "demo.email": "Email Corporativo",
    "demo.company": "Empresa",
    "demo.size": "Tamaño del Equipo",
    "demo.size.placeholder": "Seleccionar...",
    "demo.size.1": "1–5 empleados",
    "demo.size.2": "5–20 empleados",
    "demo.size.3": "20–50 empleados",
    "demo.size.4": "50+ empleados",
    "demo.phone": "Teléfono",
    "demo.message": "¿Qué buscas automatizar?",
    "demo.error.name": "Por favor ingresa tu nombre completo",
    "demo.error.email": "Por favor ingresa un correo electrónico válido",
    "demo.error.company": "Por favor ingresa el nombre de tu empresa",
    "demo.error.size": "Por favor selecciona el tamaño de tu equipo",
    "demo.error.phone": "Por favor ingresa un número de teléfono válido",
    "demo.error.message": "Por favor describe qué deseas automatizar (mín. 10 caracteres)",
    "demo.submit": "Agendar Mi Demo",
    "demo.success.title": "¡Demo Agendada!",
    "demo.success.text":
      "¡Gracias! Te contactaremos en las próximas 24 horas para programar tu demo personalizada. Revisa tu bandeja.",
    "demo.success.close": "Entendido",
  },
};

// ── i18n Engine ──
let currentLang = localStorage.getItem("oc-lang") || "en";

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("oc-lang", lang);
  document.documentElement.lang = lang;

  // Update all [data-i18n] elements
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang] && translations[lang][key]) {
      // Check if element has child nodes that should be preserved (e.g. SVG icons)
      const svg = el.querySelector("svg");
      if (svg) {
        // Preserve SVG, replace text after it
        const textNodes = Array.from(el.childNodes).filter(
          (n) => n.nodeType === Node.TEXT_NODE,
        );
        textNodes.forEach((n) => n.remove());
        el.appendChild(
          document.createTextNode(
            "\n            " + translations[lang][key] + "\n          ",
          ),
        );
      } else {
        el.textContent = translations[lang][key];
      }
    }
  });

  // Update [data-i18n-html] elements (contain inner HTML like <br> or <span>)
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (translations[lang] && translations[lang][key]) {
      el.innerHTML = translations[lang][key];
    }
  });

  // Update toggle button state
  const toggle = document.getElementById("lang-toggle");
  if (toggle) {
    toggle
      .querySelector(".lang-label--en")
      .classList.toggle("active", lang === "en");
    toggle
      .querySelector(".lang-label--es")
      .classList.toggle("active", lang === "es");
  }
}

function toggleLanguage() {
  applyLanguage(currentLang === "en" ? "es" : "en");
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("lang-toggle");
  if (toggle) {
    toggle.addEventListener("click", toggleLanguage);
  }
  // Apply saved language
  if (currentLang !== "en") {
    applyLanguage(currentLang);
  } else {
    // Still set the active state on the toggle
    applyLanguage("en");
  }
});
