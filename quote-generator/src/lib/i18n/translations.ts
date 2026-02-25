/**
 * OperisChain — i18n Translations
 *
 * Spanish (ES) and English (EN) dictionaries for all UI text.
 * ES is the primary language for Colombian freight operators.
 */

export type Locale = "es" | "en";

export const translations = {
  // ─── App Header ───
  "app.title": {
    es: "OperisChain",
    en: "OperisChain",
  },
  "app.subtitle": {
    es: "Generador de Cotizaciones",
    en: "Quote Generator",
  },
  "app.newQuote": {
    es: "Nueva Cotización",
    en: "New Quote",
  },

  // ─── Step Indicator ───
  "steps.upload": {
    es: "1. Subir",
    en: "1. Upload",
  },
  "steps.configure": {
    es: "2. Configurar",
    en: "2. Configure",
  },
  "steps.quote": {
    es: "3. Cotización",
    en: "3. Quote",
  },

  // ─── Upload Step ───
  "upload.title": {
    es: "Subir Documentos de Tarifas",
    en: "Upload Carrier Rate Documents",
  },
  "upload.subtitle": {
    es: "Suba 5-10 correos de carriers, PDFs o archivos Excel con información de tarifas. La IA extraerá y estructurará todas las tarifas automáticamente.",
    en: "Upload 5-10 carrier emails, PDFs, or Excel files with rate information. The AI will extract and structure all rates automatically.",
  },
  "upload.dropzone": {
    es: "Arrastre archivos de tarifas aquí o haga clic para explorar",
    en: "Drop carrier rate files here or click to browse",
  },
  "upload.formats": {
    es: "Soporta PDF, Excel, CSV y archivos de correo",
    en: "Supports PDF, Excel, CSV, and email files",
  },
  "upload.pasteToggle": {
    es: "O pegue texto de correo",
    en: "Or paste email text",
  },
  "upload.pasteHide": {
    es: "Ocultar área de pegado",
    en: "Hide paste area",
  },
  "upload.pastePlaceholder": {
    es: "Pegue aquí el correo reenviado del carrier con tarifas...",
    en: "Paste forwarded carrier rate email here...",
  },
  "upload.pasteSubmit": {
    es: "Procesar Texto de Correo",
    en: "Process Email Text",
  },
  "upload.uploading": {
    es: "Subiendo...",
    en: "Uploading...",
  },
  "upload.extracting": {
    es: "Extrayendo tarifas con IA...",
    en: "Extracting rates with AI...",
  },
  "upload.success": {
    es: "{count} tarifa(s) extraída(s)",
    en: "{count} rate(s) extracted",
  },
  "upload.warnings": {
    es: "{count} advertencia(s)",
    en: "{count} warning(s)",
  },
  "upload.docsProcessed": {
    es: "{count} documento(s) procesado(s)",
    en: "{count} document(s) processed",
  },
  "upload.configureQuote": {
    es: "Configurar Cotización",
    en: "Configure Quote",
  },

  // ─── Email Forwarding ───
  "email.title": {
    es: "O reenvíe su correo de tarifas",
    en: "Or forward your carrier email",
  },
  "email.subtitle": {
    es: "Reenvíe correos con tarifas de carriers directamente a:",
    en: "Forward carrier rate emails directly to:",
  },
  "email.copied": {
    es: "¡Copiado!",
    en: "Copied!",
  },
  "email.copy": {
    es: "Copiar",
    en: "Copy",
  },
  "email.howItWorks": {
    es: "El sistema extraerá las tarifas automáticamente en 30-60 segundos",
    en: "Rates will be extracted automatically in 30-60 seconds",
  },
  "email.jobPending": {
    es: "Correo recibido, en cola...",
    en: "Email received, queued...",
  },
  "email.jobProcessing": {
    es: "Extrayendo tarifas del correo...",
    en: "Extracting rates from email...",
  },
  "email.jobDone": {
    es: "{count} tarifa(s) extraída(s) del correo",
    en: "{count} rate(s) extracted from email",
  },
  "email.jobFailed": {
    es: "Error procesando correo",
    en: "Error processing email",
  },
  "email.recentJobs": {
    es: "Correos recientes",
    en: "Recent emails",
  },

  // ─── Configure Step ───
  "configure.title": {
    es: "Configurar Cotización",
    en: "Configure Your Quote",
  },
  "configure.subtitle": {
    es: "Defina los parámetros de la carga. El sistema encontrará tarifas coincidentes y generará una cotización comparativa.",
    en: "Define the cargo parameters. The system will find matching rates and generate a comparative quotation.",
  },
  "configure.origin": {
    es: "Origen",
    en: "Origin",
  },
  "configure.originPlaceholder": {
    es: "BOG o Bogotá",
    en: "BOG or Bogotá",
  },
  "configure.destination": {
    es: "Destino",
    en: "Destination",
  },
  "configure.destinationPlaceholder": {
    es: "MIA o Miami",
    en: "MIA or Miami",
  },
  "configure.weight": {
    es: "Peso (kg)",
    en: "Weight (kg)",
  },
  "configure.urgency": {
    es: "Urgencia",
    en: "Urgency",
  },
  "configure.urgencyLetAI": {
    es: "Dejar que la IA decida",
    en: "Let AI decide",
  },
  "configure.urgencyNormal": {
    es: "Normal — priorizar precio",
    en: "Normal — prioritize price",
  },
  "configure.urgencyHigh": {
    es: "Urgente — priorizar velocidad",
    en: "Urgent — prioritize speed",
  },
  "configure.mode": {
    es: "Modo de Transporte",
    en: "Freight Mode",
  },
  "configure.modeAir": {
    es: "Aéreo",
    en: "Air",
  },
  "configure.modeOceanFCL": {
    es: "Marítimo FCL",
    en: "Ocean FCL",
  },
  "configure.modeOceanLCL": {
    es: "Marítimo LCL",
    en: "Ocean LCL",
  },
  "configure.modeGroundFTL": {
    es: "Terrestre FTL",
    en: "Ground FTL",
  },
  "configure.modeGroundLTL": {
    es: "Terrestre LTL",
    en: "Ground LTL",
  },
  "configure.modeRail": {
    es: "Ferroviario",
    en: "Rail",
  },
  "configure.modeCourier": {
    es: "Courier / Express",
    en: "Courier / Express",
  },
  "configure.modeMultimodal": {
    es: "Multimodal",
    en: "Multimodal",
  },
  "configure.containerType": {
    es: "Tipo de Contenedor",
    en: "Container Type",
  },
  "configure.cargoDescription": {
    es: "Descripción de Carga",
    en: "Cargo Description",
  },
  "configure.cargoDescriptionOptional": {
    es: "(opcional)",
    en: "(optional)",
  },
  "configure.cargoDescriptionPlaceholder": {
    es: "Ej: Productos perecederos, componentes electrónicos...",
    en: "e.g., Perishable goods, electronic components...",
  },
  "configure.backToUpload": {
    es: "← Volver a subir archivos",
    en: "← Back to upload",
  },
  "configure.generate": {
    es: "Generar Cotización",
    en: "Generate Quote",
  },

  // ─── Generating Step ───
  "generating.title": {
    es: "Generando Cotización",
    en: "Generating Your Quote",
  },
  "generating.subtitle": {
    es: "Filtrando tarifas por SQL, puntuando carriers y generando recomendación con IA...",
    en: "Filtering rates by SQL, scoring carriers, and generating AI recommendation...",
  },

  // ─── Quote Result ───
  "quote.title": {
    es: "Cotización: {origin} → {destination}",
    en: "Quote: {origin} → {destination}",
  },
  "quote.meta": {
    es: "{weight}kg · {count} carriers · Generada {date}",
    en: "{weight}kg · {count} carriers · Generated {date}",
  },
  "quote.exportPDF": {
    es: "Exportar PDF",
    en: "Export PDF",
  },
  "quote.exportingPDF": {
    es: "Generando...",
    en: "Generating...",
  },
  "quote.recommendation": {
    es: "Recomendación: {carrier}",
    en: "Recommendation: {carrier}",
  },
  "quote.errorTitle": {
    es: "Error al Generar Cotización",
    en: "Error Generating Quote",
  },
  "quote.backToConfigure": {
    es: "← Volver a configuración",
    en: "← Back to configuration",
  },

  // ─── Clarification ───
  "clarification.title": {
    es: "Necesitamos una aclaración",
    en: "Clarification needed",
  },
  "clarification.urgent": {
    es: "Urgente — priorizar velocidad",
    en: "Urgent — prioritize speed",
  },
  "clarification.normal": {
    es: "Normal — priorizar precio",
    en: "Normal — prioritize price",
  },

  // ─── Table Headers ───
  "table.carrier": {
    es: "Carrier",
    en: "Carrier",
  },
  "table.route": {
    es: "Ruta",
    en: "Route",
  },
  "table.price": {
    es: "Precio (USD)",
    en: "Price (USD)",
  },
  "table.transit": {
    es: "Tránsito",
    en: "Transit",
  },
  "table.validUntil": {
    es: "Válido Hasta",
    en: "Valid Until",
  },
  "table.confidence": {
    es: "Confianza",
    en: "Confidence",
  },
  "table.score": {
    es: "Puntaje",
    en: "Score",
  },
  "table.mode": {
    es: "Modo",
    en: "Mode",
  },

  // ─── Confidence Badge ───
  "confidence.high": {
    es: "Alta",
    en: "High",
  },
  "confidence.medium": {
    es: "Media",
    en: "Medium",
  },
  "confidence.low": {
    es: "Baja — Revisar",
    en: "Low — Review",
  },

  // ─── Surcharge Banner ───
  "surcharge.noInfo": {
    es: "Sin información de surcharges — verificar precios con carrier",
    en: "No surcharge information available — verify pricing with carrier",
  },
  "surcharge.allIncluded": {
    es: "Todos los surcharges incluidos: {names}",
    en: "All surcharges included: {names}",
  },
  "surcharge.excluded": {
    es: "⚠️ El precio NO incluye: {names}.",
    en: "⚠️ Price does NOT include: {names}.",
  },
  "surcharge.unknownAdditional": {
    es: " Adicionalmente, {names} tiene estado desconocido.",
    en: " Additionally, {names} status is unknown.",
  },
  "surcharge.verifyTotal": {
    es: " Verificar costo total con carrier antes de cotizar.",
    en: " Verify total cost with carrier before quoting.",
  },
  "surcharge.unknownFor": {
    es: "Estado de surcharges desconocido para: {names}. Confirmar con carrier.",
    en: "Surcharge status unknown for: {names}. Confirm with carrier.",
  },
  "surcharge.notIncluded": {
    es: "No incluye {names}",
    en: "Does not include {names}",
  },
  "surcharge.unconfirmed": {
    es: "{names} sin confirmar",
    en: "{names} unconfirmed",
  },
  "surcharge.statusExcluded": {
    es: "no incluido",
    en: "excluded",
  },
  "surcharge.statusUnknown": {
    es: "desconocido",
    en: "unknown",
  },
  "surcharge.statusIncluded": {
    es: "incluido",
    en: "included",
  },

  // ─── Freight Mode Labels ───
  "mode.air": { es: "Aéreo", en: "Air" },
  "mode.ocean_fcl": { es: "Marítimo FCL", en: "Ocean FCL" },
  "mode.ocean_lcl": { es: "Marítimo LCL", en: "Ocean LCL" },
  "mode.ground_ftl": { es: "Terrestre FTL", en: "Ground FTL" },
  "mode.ground_ltl": { es: "Terrestre LTL", en: "Ground LTL" },
  "mode.rail": { es: "Ferroviario", en: "Rail" },
  "mode.courier": { es: "Courier", en: "Courier" },
  "mode.multimodal": { es: "Multimodal", en: "Multimodal" },
} as const;

export type TranslationKey = keyof typeof translations;

/**
 * Get a translated string with interpolation.
 *
 * Usage: t("upload.success", "es", { count: "3" })
 * Returns: "3 tarifa(s) extraída(s)"
 */
export function t(
  key: TranslationKey,
  locale: Locale,
  params?: Record<string, string | number>,
): string {
  const entry = translations[key];
  if (!entry) return key;

  let text: string = entry[locale] || entry.en || key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }

  return text;
}
