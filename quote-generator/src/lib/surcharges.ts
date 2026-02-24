/**
 * OperisChain — Surcharge Flag System
 *
 * NEVER silent about surcharges.
 * If BAF/FSC/PSS is excluded or unknown → show warning to user.
 * The system explicitly flags what's missing in the price.
 */

import type { SurchargeFlag, FreightMode } from "./db/schema";

export interface SurchargeWarning {
  level: "critical" | "warning" | "info";
  message: string;
  surcharges: SurchargeFlag[];
}

// Human-readable names for surcharge types
export const SURCHARGE_NAMES: Record<string, string> = {
  BAF: "Bunker Adjustment Factor (BAF)",
  FSC: "Fuel Surcharge (FSC)",
  PSS: "Peak Season Surcharge (PSS)",
  HANDLING: "Handling Fee",
  THC: "Terminal Handling Charge (THC)",
  ISPS: "ISPS Security Fee",
  DEMURRAGE: "Demurrage",
  DETENTION: "Detention",
  TOLL: "Toll / Peaje",
  FUEL: "Fuel Surcharge",
  DOCUMENTATION: "Documentation Fee",
  CUSTOMS: "Customs Clearance",
  INSURANCE: "Cargo Insurance",
  OTHER: "Additional Surcharge",
};

/**
 * Analyze surcharge flags and generate warnings.
 *
 * Rules:
 * - Any 'excluded' surcharge → critical warning
 * - Any 'unknown' surcharge → warning
 * - All 'included' → info (all clear)
 *
 * The UI should show a visible banner for critical/warning levels.
 */
export function getSurchargeWarnings(
  surcharges: SurchargeFlag[],
): SurchargeWarning {
  if (!surcharges || surcharges.length === 0) {
    return {
      level: "warning",
      message:
        "No surcharge information available — verify pricing with carrier",
      surcharges: [],
    };
  }

  const excluded = surcharges.filter((s) => s.status === "excluded");
  const unknown = surcharges.filter((s) => s.status === "unknown");
  const included = surcharges.filter((s) => s.status === "included");

  // All included — great
  if (excluded.length === 0 && unknown.length === 0) {
    const includedNames = included
      .map((s) => SURCHARGE_NAMES[s.type] || s.type)
      .join(", ");
    return {
      level: "info",
      message: `All surcharges included: ${includedNames}`,
      surcharges: included,
    };
  }

  // Some excluded — critical
  if (excluded.length > 0) {
    const excludedNames = excluded
      .map((s) => SURCHARGE_NAMES[s.type] || s.type)
      .join(", ");
    const unknownPart =
      unknown.length > 0
        ? ` Additionally, ${unknown.map((s) => SURCHARGE_NAMES[s.type] || s.type).join(", ")} status is unknown.`
        : "";

    return {
      level: "critical",
      message: `⚠️ Price does NOT include: ${excludedNames}.${unknownPart} Verify total cost with carrier before quoting.`,
      surcharges: [...excluded, ...unknown],
    };
  }

  // Some unknown — warning
  const unknownNames = unknown
    .map((s) => SURCHARGE_NAMES[s.type] || s.type)
    .join(", ");
  return {
    level: "warning",
    message: `Surcharge status unknown for: ${unknownNames}. Confirm with carrier.`,
    surcharges: unknown,
  };
}

/**
 * Generate the price footnote for a quote line.
 *
 * Returns the asterisk note like: "* No incluye BAF ni FSC"
 */
export function getPriceFootnote(surcharges: SurchargeFlag[]): string | null {
  const excluded = surcharges.filter((s) => s.status === "excluded");
  const unknown = surcharges.filter((s) => s.status === "unknown");

  if (excluded.length === 0 && unknown.length === 0) {
    return null;
  }

  const parts: string[] = [];

  if (excluded.length > 0) {
    const names = excluded.map((s) => s.type).join(", ");
    parts.push(`No incluye ${names}`);
  }

  if (unknown.length > 0) {
    const names = unknown.map((s) => s.type).join(", ");
    parts.push(`${names} sin confirmar`);
  }

  return `* ${parts.join(". ")}`;
}

/**
 * Default surcharge flags based on freight mode.
 * Used as a starting point — LLM updates statuses during extraction.
 */
export function getDefaultSurchargeFlags(mode?: FreightMode): SurchargeFlag[] {
  const note = "Not specified in source";

  switch (mode) {
    case "ocean_fcl":
    case "ocean_lcl":
      return [
        { type: "BAF", status: "unknown", note },
        { type: "THC", status: "unknown", note },
        { type: "ISPS", status: "unknown", note },
        { type: "DEMURRAGE", status: "unknown", note },
        { type: "DETENTION", status: "unknown", note },
        { type: "DOCUMENTATION", status: "unknown", note },
      ];
    case "ground_ftl":
    case "ground_ltl":
      return [
        { type: "TOLL", status: "unknown", note },
        { type: "FUEL", status: "unknown", note },
        { type: "INSURANCE", status: "unknown", note },
        { type: "HANDLING", status: "unknown", note },
      ];
    case "rail":
      return [
        { type: "HANDLING", status: "unknown", note },
        { type: "FUEL", status: "unknown", note },
        { type: "DOCUMENTATION", status: "unknown", note },
      ];
    case "courier":
      return [
        { type: "FSC", status: "unknown", note },
        { type: "CUSTOMS", status: "unknown", note },
        { type: "INSURANCE", status: "unknown", note },
        { type: "HANDLING", status: "unknown", note },
      ];
    case "multimodal":
      return [
        { type: "BAF", status: "unknown", note },
        { type: "FSC", status: "unknown", note },
        { type: "THC", status: "unknown", note },
        { type: "HANDLING", status: "unknown", note },
        { type: "TOLL", status: "unknown", note },
        { type: "CUSTOMS", status: "unknown", note },
      ];
    case "air":
    default:
      return [
        { type: "BAF", status: "unknown", note },
        { type: "FSC", status: "unknown", note },
        { type: "PSS", status: "unknown", note },
        { type: "HANDLING", status: "unknown", note },
      ];
  }
}
