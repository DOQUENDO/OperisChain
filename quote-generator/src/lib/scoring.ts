/**
 * OperisChain — Rate Scoring Function
 *
 * Deterministic scoring — NOT vibes.
 * The function picks the winner. The LLM explains it.
 *
 * Score components:
 * - Price (50% weight by default) — cheaper = better
 * - Transit time (30% weight) — faster = better
 * - Confidence (20% weight) — cleaner data = more reliable
 * - Urgency override: if urgency is high, transit time weight increases
 */

import type { SurchargeFlag, FreightMode } from "./db/schema";

export interface RateForScoring {
  price: number; // in USD
  transitDays: number | null;
  confidenceScore: number; // 0.0 - 1.0
  surcharges: SurchargeFlag[];
  validUntil: string | null;
  freightMode?: FreightMode;
}

export interface ScoreContext {
  urgency: "high" | "normal" | "unknown";
  preferredCarriers?: string[];
  mode?: FreightMode;
}

export interface ScoredRate {
  score: number; // 0.0 - 1.0 (higher = better)
  breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  priceScore: number;
  transitScore: number;
  confidenceScore: number;
  urgencyBonus: number;
  surchargesPenalty: number;
  total: number;
}

// ─── Mode-Specific Reference Values ───
// Used to normalize price and transit scores per mode
const MODE_REFERENCES: Record<
  FreightMode,
  { maxPrice: number; maxTransitDays: number }
> = {
  air: { maxPrice: 50, maxTransitDays: 10 },
  ocean_fcl: { maxPrice: 8000, maxTransitDays: 60 },
  ocean_lcl: { maxPrice: 3000, maxTransitDays: 60 },
  ground_ftl: { maxPrice: 5000, maxTransitDays: 7 },
  ground_ltl: { maxPrice: 2000, maxTransitDays: 10 },
  rail: { maxPrice: 6000, maxTransitDays: 45 },
  courier: { maxPrice: 100, maxTransitDays: 5 },
  multimodal: { maxPrice: 10000, maxTransitDays: 45 },
};

/**
 * Score a rate based on price, transit time, confidence, and context.
 *
 * Returns a normalized score between 0 and 1 (higher = better).
 * Mode-aware: uses different maxPrice and maxTransit per freight mode.
 */
export function scoreRate(
  rate: RateForScoring,
  context: ScoreContext,
): ScoredRate {
  // Determine mode for reference values
  const mode: FreightMode = rate.freightMode || context.mode || "air";
  const refs = MODE_REFERENCES[mode];

  // ─── Price Score (cheaper = better) ───
  const priceScore = Math.max(0, Math.min(1, 1 - rate.price / refs.maxPrice));

  // ─── Transit Score (faster = better) ───
  // Mode-aware: different reference max transit per mode
  const transitScore =
    rate.transitDays !== null
      ? Math.max(0, Math.min(1, 1 - rate.transitDays / refs.maxTransitDays))
      : 0.5;

  // ─── Confidence Score ───
  const confidenceScore = rate.confidenceScore;

  // ─── Urgency Bonus ───
  // If urgency is high, fast transit gets a bonus
  let urgencyBonus = 0;
  if (context.urgency === "high" && rate.transitDays !== null) {
    urgencyBonus = Math.max(0, Math.min(0.5, (1 / rate.transitDays) * 0.5));
  }

  // ─── Surcharges Penalty ───
  // Each excluded or unknown surcharge reduces the score
  const surchargesPenalty = rate.surcharges.reduce((penalty, s) => {
    if (s.status === "excluded") return penalty + 0.05;
    if (s.status === "unknown") return penalty + 0.03;
    return penalty;
  }, 0);

  // ─── Weighted Total ───
  const baseWeights = {
    price: context.urgency === "high" ? 0.35 : 0.5,
    transit: context.urgency === "high" ? 0.45 : 0.3,
    confidence: 0.2,
  };

  const total = Math.max(
    0,
    Math.min(
      1,
      priceScore * baseWeights.price +
        transitScore * baseWeights.transit +
        confidenceScore * baseWeights.confidence +
        urgencyBonus -
        surchargesPenalty,
    ),
  );

  return {
    score: Math.round(total * 1000) / 1000,
    breakdown: {
      priceScore: Math.round(priceScore * 1000) / 1000,
      transitScore: Math.round(transitScore * 1000) / 1000,
      confidenceScore: Math.round(confidenceScore * 1000) / 1000,
      urgencyBonus: Math.round(urgencyBonus * 1000) / 1000,
      surchargesPenalty: Math.round(surchargesPenalty * 1000) / 1000,
      total: Math.round(total * 1000) / 1000,
    },
  };
}

/**
 * Score and rank an array of rates.
 * Returns rates sorted by score (highest first).
 */
export function rankRates<T extends RateForScoring>(
  rates: T[],
  context: ScoreContext,
): (T & { score: number; scoreBreakdown: ScoreBreakdown })[] {
  return rates
    .map((rate) => {
      const { score, breakdown } = scoreRate(rate, context);
      return { ...rate, score, scoreBreakdown: breakdown };
    })
    .sort((a, b) => b.score - a.score);
}
