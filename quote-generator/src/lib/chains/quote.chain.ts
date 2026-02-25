/**
 * OperisChain — Quote Chain
 *
 * LangChain LCEL chain for quote generation reasoning.
 * Uses Claude Sonnet for complex analysis (better than GPT for document reasoning).
 *
 * This is Stage 3 of the architecture:
 * The LLM receives CLEAN, PRE-VALIDATED data from SQL queries.
 * It does NOT extract raw numbers — it ranks, explains, and recommends.
 *
 * Output validated with Zod QuoteReasoningSchema.
 * Every call traced with LangSmith.
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { QuoteReasoningSchema, type QuoteReasoning } from "../schemas";
import type { Rate, FreightMode } from "../db/schema";
import type { ScoreBreakdown } from "../scoring";

export interface QuoteChainInput {
  rates: (Rate & { score: number; scoreBreakdown: ScoreBreakdown })[];
  cargo: {
    origin: string;
    destination: string;
    weightKg: number;
    urgency: "high" | "normal" | "unknown";
    mode?: FreightMode;
    description?: string;
  };
  context?: string; // Additional RAG context from contracts/notes
}

/**
 * Create the quote reasoning chain.
 *
 * Pipeline: filtered rates + cargo def → Claude → reasoning + recommendation → Zod validation
 */
export function createQuoteChain() {
  const model = new ChatAnthropic({
    modelName: "claude-sonnet-4-20250514",
    temperature: 0.3, // Some creativity for explanations
    maxTokens: 2048,
    maxRetries: 3, // Auto-retry on 429/529 (overloaded) errors
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `Eres un analista experto en logística internacional y freight forwarding en Colombia y LatAm.

Tu trabajo es analizar tarifas de carriers ya filtradas y validadas, y generar una recomendación fundamentada para el operador.

MODOS DE TRANSPORTE:
- air: Carga aérea (precio por kg, tránsito en días)
- ocean_fcl: Marítimo contenedor completo (precio por contenedor, tránsito en días)
- ocean_lcl: Marítimo carga suelta (precio por kg/CBM, tránsito en días)
- ground_ftl: Terrestre camión completo (tarifa fija o por kg)
- ground_ltl: Terrestre carga parcial (por kg o pallet)
- rail: Ferroviario
- courier: Courier/express (door-to-door)
- multimodal: Combinación de modos

REGLAS:
- Las tarifas que recibes ya están validadas por SQL. NO cuestiones los números.
- Tu trabajo es RAZONAR sobre las opciones: considerar precio, tiempo, confiabilidad, surcharges.
- Si la urgencia es 'unknown', DEBES marcar needsClarification: true y preguntar al usuario.
- Si hay surcharges excluidos o desconocidos, DEBES mencionarlos en el razonamiento.
- Para marítimo: mencionar THC, ISPS, demurrage/detention. Para terrestre: mencionar peajes, combustible.
- Si un confidence_score es bajo (<0.7), DEBES advertir al usuario.
- Escribe el razonamiento en ESPAÑOL — el operador es colombiano.
- Sé específico y directo. Nada de frases genéricas.

RESPONDE SIEMPRE en JSON válido, sin markdown ni bloques de código.`,
    ],
    [
      "human",
      `DATOS DE LA COTIZACIÓN:
Origen: {origin}
Destino: {destination}
Peso: {weightKg} kg
Urgencia: {urgency}
Modo de transporte: {mode}
{description}

TARIFAS DISPONIBLES (ya filtradas por ruta y peso):
{ratesJson}

{additionalContext}

Analiza las tarifas y genera tu recomendación. Responde con EXACTAMENTE este formato JSON (sin markdown, sin bloques de código):

{{
  "recommended": "Nombre del carrier recomendado",
  "reasoning": "Explicación detallada en español de por qué se recomienda este carrier...",
  "needsClarification": false,
  "clarificationQuestion": null,
  "lineNotes": [
    {{ "carrier": "Carrier A", "note": "Nota específica sobre esta opción" }},
    {{ "carrier": "Carrier B", "note": "Nota específica sobre esta opción" }}
  ]
}}

Reglas de campos:
- "recommended": string (nombre exacto del carrier)
- "reasoning": string (en español, mínimo 2-3 oraciones)
- "needsClarification": boolean (true si urgency es 'unknown')
- "clarificationQuestion": string o null
- "lineNotes": array de objetos con "carrier" y "note"

Responde SOLO con JSON válido:`,
    ],
  ]);

  const chain = RunnableSequence.from([
    // Step 1: Format the input
    (input: QuoteChainInput) => ({
      origin: input.cargo.origin,
      destination: input.cargo.destination,
      weightKg: input.cargo.weightKg,
      urgency: input.cargo.urgency,
      mode: input.cargo.mode || "air",
      description: input.cargo.description
        ? `Descripción: ${input.cargo.description}`
        : "",
      ratesJson: JSON.stringify(
        input.rates.map((r) => ({
          carrier: r.carrier,
          route: `${r.origin} → ${r.destination}`,
          priceUSD: r.price,
          transitDays: r.transitDays,
          validUntil: r.validUntil,
          validityWarning: r.validityWarning,
          surcharges: r.surcharges,
          confidenceScore: r.confidenceScore,
          score: r.score,
          scoreBreakdown: r.scoreBreakdown,
        })),
        null,
        2,
      ),
      additionalContext: input.context
        ? `CONTEXTO ADICIONAL (de contratos y notas):\n${input.context}`
        : "",
    }),
    // Step 2: Send to Claude
    prompt,
    model,
    // Step 3: Parse, coerce, and validate with Zod
    async (response) => {
      const content = response.content as string;

      let parsed: unknown;
      try {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonStr = jsonMatch ? jsonMatch[1]! : content;
        parsed = JSON.parse(jsonStr.trim());
      } catch {
        throw new Error(
          `Failed to parse Claude response as JSON: ${content.substring(0, 200)}...`,
        );
      }

      // Pre-process: coerce snake_case and common LLM output variations
      if (parsed && typeof parsed === "object") {
        const obj = parsed as Record<string, unknown>;

        // snake_case → camelCase coercions
        if ("needs_clarification" in obj && !("needsClarification" in obj)) {
          obj.needsClarification = obj.needs_clarification;
          delete obj.needs_clarification;
        }
        if (
          "clarification_question" in obj &&
          !("clarificationQuestion" in obj)
        ) {
          obj.clarificationQuestion = obj.clarification_question;
          delete obj.clarification_question;
        }
        if ("line_notes" in obj && !("lineNotes" in obj)) {
          obj.lineNotes = obj.line_notes;
          delete obj.line_notes;
        }
        if ("recommended_carrier" in obj && !("recommended" in obj)) {
          obj.recommended = obj.recommended_carrier;
          delete obj.recommended_carrier;
        }

        // Handle lineNotes as object instead of array
        if (
          obj.lineNotes &&
          !Array.isArray(obj.lineNotes) &&
          typeof obj.lineNotes === "object"
        ) {
          obj.lineNotes = Object.entries(
            obj.lineNotes as Record<string, string>,
          ).map(([carrier, note]) => ({ carrier, note: String(note) }));
        }
      }

      const validated = QuoteReasoningSchema.safeParse(parsed);
      if (!validated.success) {
        console.error(
          "Zod validation failed. Raw Claude output:",
          JSON.stringify(parsed, null, 2).substring(0, 1000),
        );
        throw new Error(
          `Claude output failed Zod validation: ${validated.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
        );
      }

      return validated.data;
    },
  ]);

  return chain;
}

/**
 * Generate quote reasoning from pre-filtered rates.
 *
 * @param input - Filtered rates, cargo definition, and optional context
 * @returns Validated QuoteReasoning with recommendation and explanation
 */
export async function generateQuoteReasoning(
  input: QuoteChainInput,
): Promise<QuoteReasoning> {
  const chain = createQuoteChain();

  const result = await chain.invoke(input, {
    metadata: {
      module: "quote-reasoning",
      version: "1.0",
      origin: input.cargo.origin,
      destination: input.cargo.destination,
    },
    tags: ["quote", "reasoning", "quote-generator"],
  });

  return result;
}
