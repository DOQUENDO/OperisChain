/**
 * OperisChain — Data Normalizers
 *
 * Deterministic normalization for freight data.
 * These functions ensure consistency before data enters the rates table.
 *
 * Key principles:
 * - null is honest. If we can't parse something, return null + warning.
 * - Never guess. Let the user decide on ambiguous data.
 * - IATA codes are always 3-letter uppercase.
 */

import { parseISO, isValid, endOfMonth, endOfQuarter, format } from "date-fns";
import type { FreightMode } from "../db/schema";

// ─── Common IATA Code Mappings (Air) ───
const IATA_MAP: Record<string, string> = {
  // Colombia
  bogota: "BOG",
  bogotá: "BOG",
  "el dorado": "BOG",
  medellin: "MDE",
  medellín: "MDE",
  rionegro: "MDE",
  cali: "CLO",
  "alfonso bonilla aragon": "CLO",
  barranquilla: "BAQ",
  cartagena: "CTG",
  bucaramanga: "BGA",
  pereira: "PEI",
  // USA
  miami: "MIA",
  "new york": "JFK",
  "nueva york": "JFK",
  "los angeles": "LAX",
  houston: "IAH",
  atlanta: "ATL",
  chicago: "ORD",
  dallas: "DFW",
  orlando: "MCO",
  // Europe
  madrid: "MAD",
  barcelona: "BCN",
  london: "LHR",
  londres: "LHR",
  paris: "CDG",
  amsterdam: "AMS",
  frankfurt: "FRA",
  // Asia
  shanghai: "PVG",
  shenzhen: "SZX",
  "hong kong": "HKG",
  tokyo: "NRT",
  singapore: "SIN",
  singapur: "SIN",
  // LatAm
  lima: "LIM",
  santiago: "SCL",
  "buenos aires": "EZE",
  "mexico city": "MEX",
  "ciudad de mexico": "MEX",
  cdmx: "MEX",
  "sao paulo": "GRU",
  "são paulo": "GRU",
  panama: "PTY",
  panamá: "PTY",
  quito: "UIO",
  guayaquil: "GYE",
};

// ─── UN/LOCODE Port Codes (Ocean/Ground) ───
// Format: COXXX (2-letter country + 3-letter city)
const UNLOCODE_MAP: Record<string, string> = {
  // Colombia — ports
  buenaventura: "COBUN",
  "puerto buenaventura": "COBUN",
  "santa marta": "COSMR",
  "puerto de santa marta": "COSMR",
  "puerto cartagena": "COCTG",
  cartagena: "COCTG", // override IATA — ocean context = port
  barranquilla: "COBAQ",
  turbo: "COTRB",
  tumaco: "COTCO",
  // Colombia — ground cities
  bogota: "COBOG",
  bogotá: "COBOG",
  medellin: "COMED",
  medellín: "COMED",
  cali: "COCLI",
  bucaramanga: "COBGA",
  pereira: "COPEI",
  manizales: "COMZL",
  cucuta: "COCUC",
  cúcuta: "COCUC",
  ibague: "COIBG",
  ibagué: "COIBG",
  // USA — ports
  "port miami": "USMIA",
  "port everglades": "USPEF",
  "fort lauderdale": "USPEF",
  houston: "USHOU",
  "port houston": "USHOU",
  "new york": "USNYC",
  "port newark": "USNYC",
  "los angeles": "USLAX",
  "long beach": "USLGB",
  savannah: "USSAV",
  charleston: "USCHS",
  // Europe — ports
  rotterdam: "NLRTM",
  amberes: "BEANR",
  antwerp: "BEANR",
  hamburgo: "DEHAM",
  hamburg: "DEHAM",
  barcelona: "ESBCN",
  valencia: "ESVLC",
  algeciras: "ESALG",
  "le havre": "FRLEH",
  genova: "ITGOA",
  genoa: "ITGOA",
  // Asia — ports
  shanghai: "CNSHA",
  shenzhen: "CNSZX",
  "hong kong": "HKHKG",
  singapur: "SGSIN",
  singapore: "SGSIN",
  busan: "KRPUS",
  tokio: "JPTYO",
  tokyo: "JPTYO",
  // LatAm — ports
  callao: "PECLL",
  lima: "PECLL", // Callao is Lima's port
  "san antonio": "CLSAI",
  valparaiso: "CLVAP",
  "buenos aires": "ARBUE",
  santos: "BRSSZ",
  "sao paulo": "BRSSZ", // Santos is SP's port
  "são paulo": "BRSSZ",
  manzanillo: "MXZLO",
  colon: "PAONX",
  colón: "PAONX",
  balboa: "PABLB",
  guayaquil: "ECGYE",
};

// ─── Reverse lookup: code → display name ───
const CODE_DISPLAY_NAMES: Record<string, string> = {
  // IATA
  BOG: "Bogotá (BOG)",
  MDE: "Medellín (MDE)",
  CLO: "Cali (CLO)",
  BAQ: "Barranquilla (BAQ)",
  CTG: "Cartagena (CTG)",
  BGA: "Bucaramanga (BGA)",
  PEI: "Pereira (PEI)",
  MIA: "Miami (MIA)",
  JFK: "New York (JFK)",
  LAX: "Los Angeles (LAX)",
  IAH: "Houston (IAH)",
  ATL: "Atlanta (ATL)",
  MAD: "Madrid (MAD)",
  AMS: "Amsterdam (AMS)",
  FRA: "Frankfurt (FRA)",
  LHR: "London (LHR)",
  CDG: "Paris (CDG)",
  LIM: "Lima (LIM)",
  SCL: "Santiago (SCL)",
  EZE: "Buenos Aires (EZE)",
  MEX: "Ciudad de México (MEX)",
  GRU: "São Paulo (GRU)",
  PTY: "Panamá (PTY)",
  UIO: "Quito (UIO)",
  GYE: "Guayaquil (GYE)",
  // UNLOCODE
  COBOG: "Bogotá",
  COMED: "Medellín",
  COCLI: "Cali",
  COBAQ: "Barranquilla",
  COCTG: "Cartagena",
  COBGA: "Bucaramanga",
  COPEI: "Pereira",
  COMZL: "Manizales",
  COCUC: "Cúcuta",
  COIBG: "Ibagué",
  COBUN: "Buenaventura",
  COSMR: "Santa Marta",
  COTRB: "Turbo",
  COTCO: "Tumaco",
  USMIA: "Miami",
  USPEF: "Fort Lauderdale",
  USHOU: "Houston",
  USNYC: "New York",
  USLAX: "Los Angeles",
  USLGB: "Long Beach",
  USSAV: "Savannah",
  USCHS: "Charleston",
  NLRTM: "Rotterdam",
  BEANR: "Amberes",
  DEHAM: "Hamburgo",
  ESBCN: "Barcelona",
  ESVLC: "Valencia",
  FRLEH: "Le Havre",
  ITGOA: "Génova",
  CNSHA: "Shanghai",
  CNSZX: "Shenzhen",
  HKHKG: "Hong Kong",
  SGSIN: "Singapur",
  KRPUS: "Busan",
  JPTYO: "Tokio",
  PECLL: "Callao",
  CLSAI: "San Antonio",
  CLVAP: "Valparaíso",
  ARBUE: "Buenos Aires",
  BRSSZ: "Santos",
  MXZLO: "Manzanillo",
  PAONX: "Colón",
  PABLB: "Balboa",
  ECGYE: "Guayaquil",
};

/**
 * Get a human-readable display name for a location code.
 * Returns the original code if no display name found.
 */
export function getLocationDisplayName(code: string): string {
  return CODE_DISPLAY_NAMES[code] || code;
}

/**
 * Normalize a location string to a 3-letter IATA code (air mode).
 *
 * Handles:
 * - Already valid IATA codes: "BOG" → "BOG"
 * - City names: "Bogotá" → "BOG"
 * - Arrow/dash notation: "BOG→MIA" → extracts individual codes
 * - Country names: "Colombia" → "BOG" (capital)
 *
 * @returns { code: string | null, warning: string | null }
 */
export function normalizeIATA(raw: string): {
  code: string | null;
  warning: string | null;
} {
  if (!raw || raw.trim().length === 0) {
    return { code: null, warning: "Location is empty" };
  }

  const cleaned = raw.trim();

  // Already a 3-letter IATA code
  if (/^[A-Z]{3}$/i.test(cleaned)) {
    return { code: cleaned.toUpperCase(), warning: null };
  }

  // Look up in mapping
  const normalized = cleaned
    .toLowerCase()
    .replace(/[^a-záéíóúñü\s]/g, "")
    .trim();
  const match = IATA_MAP[normalized];
  if (match) {
    return { code: match, warning: null };
  }

  // Try partial match
  for (const [key, code] of Object.entries(IATA_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { code, warning: `Interpreted "${raw}" as ${code}` };
    }
  }

  return {
    code: null,
    warning: `Could not resolve IATA code for "${raw}" — manual review required`,
  };
}

/**
 * Normalize a location string for a specific freight mode.
 *
 * - Air: IATA codes (BOG, MIA)
 * - Ocean: UN/LOCODE port codes (COBUN, NLRTM)
 * - Ground: UN/LOCODE city codes or city names
 * - Courier/Rail: tries both, prefers IATA
 *
 * @returns { code: string | null, codeType: 'iata' | 'unlocode' | 'city', warning: string | null }
 */
export function normalizeLocation(
  raw: string,
  mode: FreightMode,
): {
  code: string | null;
  codeType: "iata" | "unlocode" | "city";
  warning: string | null;
} {
  if (!raw || raw.trim().length === 0) {
    return { code: null, codeType: "city", warning: "Location is empty" };
  }

  const cleaned = raw.trim();
  const normalizedLower = cleaned
    .toLowerCase()
    .replace(/[^a-záéíóúñü\s]/g, "")
    .trim();

  // Air mode → prefer IATA
  if (mode === "air" || mode === "courier") {
    const iata = normalizeIATA(cleaned);
    if (iata.code)
      return { code: iata.code, codeType: "iata", warning: iata.warning };
    // Fallback to UNLOCODE
    const unlocode = UNLOCODE_MAP[normalizedLower];
    if (unlocode)
      return {
        code: unlocode,
        codeType: "unlocode",
        warning: `Using port code for air route: ${unlocode}`,
      };
    return {
      code: null,
      codeType: "city",
      warning: `Could not resolve location "${raw}"`,
    };
  }

  // Ocean mode → prefer UNLOCODE
  if (mode === "ocean_fcl" || mode === "ocean_lcl") {
    // Already a valid UNLOCODE (5 chars: 2 country + 3 city)
    if (/^[A-Z]{5}$/i.test(cleaned)) {
      return {
        code: cleaned.toUpperCase(),
        codeType: "unlocode",
        warning: null,
      };
    }
    const unlocode = UNLOCODE_MAP[normalizedLower];
    if (unlocode)
      return { code: unlocode, codeType: "unlocode", warning: null };
    // Fallback to IATA (some routes use airport codes)
    const iata = normalizeIATA(cleaned);
    if (iata.code)
      return {
        code: iata.code,
        codeType: "iata",
        warning: `Using IATA code for ocean route — verify port: ${iata.code}`,
      };
    // Partial match on UNLOCODE
    for (const [key, code] of Object.entries(UNLOCODE_MAP)) {
      if (normalizedLower.includes(key) || key.includes(normalizedLower)) {
        return {
          code,
          codeType: "unlocode",
          warning: `Interpreted "${raw}" as ${code}`,
        };
      }
    }
    return {
      code: null,
      codeType: "city",
      warning: `Could not resolve port for "${raw}"`,
    };
  }

  // Ground mode → prefer UNLOCODE city codes, then city names
  if (mode === "ground_ftl" || mode === "ground_ltl") {
    if (/^[A-Z]{5}$/i.test(cleaned)) {
      return {
        code: cleaned.toUpperCase(),
        codeType: "unlocode",
        warning: null,
      };
    }
    const unlocode = UNLOCODE_MAP[normalizedLower];
    if (unlocode)
      return { code: unlocode, codeType: "unlocode", warning: null };
    // For ground, we can accept city names directly
    const iata = normalizeIATA(cleaned);
    if (iata.code) return { code: iata.code, codeType: "iata", warning: null };
    // Partial match
    for (const [key, code] of Object.entries(UNLOCODE_MAP)) {
      if (normalizedLower.includes(key) || key.includes(normalizedLower)) {
        return {
          code,
          codeType: "unlocode",
          warning: `Interpreted "${raw}" as ${code}`,
        };
      }
    }
    // Accept raw city name title-cased
    const titleCased = cleaned
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
    return {
      code: titleCased,
      codeType: "city",
      warning: `Using city name "${titleCased}" — no standard code found`,
    };
  }

  // Rail/multimodal → try IATA first, then UNLOCODE
  const iata = normalizeIATA(cleaned);
  if (iata.code)
    return { code: iata.code, codeType: "iata", warning: iata.warning };
  const unlocode = UNLOCODE_MAP[normalizedLower];
  if (unlocode) return { code: unlocode, codeType: "unlocode", warning: null };
  return {
    code: null,
    codeType: "city",
    warning: `Could not resolve location "${raw}"`,
  };
}

/**
 * Normalize a validity date string to a Date or null.
 *
 * Handles:
 * - ISO dates: "2025-03-31" → Date
 * - "until further notice" → null + warning
 * - "end of month" → last day of current month
 * - "end of quarter" → last day of current quarter
 * - "hasta nuevo aviso" → null + warning (Spanish)
 * - Unparseable → null + warning
 *
 * null is honest. Never guess a date.
 */
export function normalizeValidity(raw: string | null | undefined): {
  date: Date | null;
  warning: string | null;
  formatted: string | null;
} {
  if (!raw || raw.trim().length === 0) {
    return {
      date: null,
      warning: "No validity date provided — verify with carrier",
      formatted: null,
    };
  }

  const cleaned = raw.trim().toLowerCase();

  // "Until further notice" patterns (EN/ES)
  if (
    /until further notice/i.test(cleaned) ||
    /hasta nuevo aviso/i.test(cleaned) ||
    /sin fecha de vencimiento/i.test(cleaned) ||
    /indefinid[oa]/i.test(cleaned) ||
    /no expiry/i.test(cleaned) ||
    /tbd/i.test(cleaned) ||
    /to be determined/i.test(cleaned)
  ) {
    return {
      date: null,
      warning: "Vigencia indefinida — verificar con carrier",
      formatted: null,
    };
  }

  // "End of month" patterns
  if (/end of month/i.test(cleaned) || /fin de mes/i.test(cleaned)) {
    const d = endOfMonth(new Date());
    return { date: d, warning: null, formatted: format(d, "yyyy-MM-dd") };
  }

  // "End of quarter" patterns
  if (/end of quarter/i.test(cleaned) || /fin de trimestre/i.test(cleaned)) {
    const d = endOfQuarter(new Date());
    return { date: d, warning: null, formatted: format(d, "yyyy-MM-dd") };
  }

  // Try ISO parse
  const parsed = parseISO(raw.trim());
  if (isValid(parsed)) {
    return {
      date: parsed,
      warning: null,
      formatted: format(parsed, "yyyy-MM-dd"),
    };
  }

  // Try common date formats with regex
  // DD/MM/YYYY or MM/DD/YYYY
  const slashMatch = raw
    .trim()
    .match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (slashMatch) {
    const [, a, b, year] = slashMatch;
    // Assume DD/MM/YYYY for LatAm context
    const d = new Date(parseInt(year), parseInt(b!) - 1, parseInt(a!));
    if (isValid(d)) {
      return {
        date: d,
        warning: `Interpreted as DD/MM/YYYY: ${format(d, "yyyy-MM-dd")}`,
        formatted: format(d, "yyyy-MM-dd"),
      };
    }
  }

  return {
    date: null,
    warning: `Fecha no parseable: "${raw}" — revisión manual requerida`,
    formatted: null,
  };
}

// ─── Currency Exchange Rates (simplified for v1) ───
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08, // EUR to USD
  COP: 0.00024, // COP to USD (approx 4,200 COP = 1 USD)
};

/**
 * Normalize a currency amount to USD.
 *
 * @param amount - The raw amount
 * @param currency - The source currency code
 * @returns { amountUSD: number, warning: string | null }
 */
export function normalizeCurrency(
  amount: number,
  currency: string,
): { amountUSD: number; warning: string | null } {
  const code = currency.toUpperCase().trim();

  if (code === "USD") {
    return { amountUSD: amount, warning: null };
  }

  const rate = EXCHANGE_RATES[code];
  if (rate) {
    return {
      amountUSD: Math.round(amount * rate * 100) / 100,
      warning: `Converted from ${code} to USD at rate ${rate} (approximate)`,
    };
  }

  return {
    amountUSD: amount,
    warning: `Unknown currency "${currency}" — amount kept as-is, manual review required`,
  };
}

/**
 * Normalize carrier name to consistent format.
 *
 * Handles common abbreviations and casing:
 * - "AVC" → "Avianca Cargo"
 * - "avianca" → "Avianca Cargo"
 * - "LATAM" → "LATAM Cargo"
 */
const CARRIER_MAP: Record<string, string> = {
  avianca: "Avianca Cargo",
  avc: "Avianca Cargo",
  "avianca cargo": "Avianca Cargo",
  latam: "LATAM Cargo",
  "latam cargo": "LATAM Cargo",
  la: "LATAM Cargo",
  copa: "Copa Airlines Cargo",
  "copa cargo": "Copa Airlines Cargo",
  american: "American Airlines Cargo",
  "aa cargo": "American Airlines Cargo",
  aa: "American Airlines Cargo",
  united: "United Cargo",
  ua: "United Cargo",
  "united cargo": "United Cargo",
  delta: "Delta Cargo",
  dl: "Delta Cargo",
  "delta cargo": "Delta Cargo",
  fedex: "FedEx",
  "fed ex": "FedEx",
  dhl: "DHL Express",
  "dhl express": "DHL Express",
  ups: "UPS",
  "ups freight": "UPS",
  maersk: "Maersk",
  "maersk line": "Maersk",
  msc: "MSC",
  "mediterranean shipping": "MSC",
  hapag: "Hapag-Lloyd",
  "hapag lloyd": "Hapag-Lloyd",
  "hapag-lloyd": "Hapag-Lloyd",
  "cma cgm": "CMA CGM",
  cma: "CMA CGM",
  evergreen: "Evergreen",
  "evergreen marine": "Evergreen",
  lufthansa: "Lufthansa Cargo",
  "lufthansa cargo": "Lufthansa Cargo",
  turkish: "Turkish Cargo",
  "turkish cargo": "Turkish Cargo",
  tk: "Turkish Cargo",
  emirates: "Emirates SkyCargo",
  "emirates skycargo": "Emirates SkyCargo",
  qatar: "Qatar Cargo",
  "qatar cargo": "Qatar Cargo",
  cargolux: "Cargolux",
  "atlas air": "Atlas Air",
  atlas: "Atlas Air",
  // ─── Ground Carriers (LatAm) ───
  coordinadora: "Coordinadora",
  "coordinadora mercantil": "Coordinadora",
  tcc: "TCC",
  envia: "Envía",
  envía: "Envía",
  servientrega: "Servientrega",
  deprisa: "Deprisa",
  interrapidisimo: "Inter Rapidísimo",
  "inter rapidisimo": "Inter Rapidísimo",
  "inter rapidísimo": "Inter Rapidísimo",
  saferbo: "Saferbo",
  "open market": "Open Market",
  redetrans: "Redetrans",
  coltanques: "Coltanques",
  "r franco": "R. Franco",
  "botero soto": "Botero Soto",
  // ─── Ocean Carriers (additional) ───
  cosco: "COSCO",
  "cosco shipping": "COSCO",
  yang: "Yang Ming",
  "yang ming": "Yang Ming",
  one: "ONE",
  "ocean network express": "ONE",
  zim: "ZIM",
  "zim integrated": "ZIM",
  pil: "PIL",
  "pacific intl lines": "PIL",
  wan: "Wan Hai Lines",
  "wan hai": "Wan Hai Lines",
  "hamburg sud": "Hamburg Süd",
  "hamburg süd": "Hamburg Süd",
  "king ocean": "King Ocean",
  "king ocean services": "King Ocean",
  seaboard: "Seaboard Marine",
  "seaboard marine": "Seaboard Marine",
  crowley: "Crowley",
  "crowley liner": "Crowley",
  "great white fleet": "Great White Fleet",
  nyk: "NYK Line",
  "nyk line": "NYK Line",
};

export function normalizeCarrier(raw: string): {
  name: string;
  warning: string | null;
} {
  if (!raw || raw.trim().length === 0) {
    return { name: "Unknown Carrier", warning: "Carrier name is empty" };
  }

  const cleaned = raw.trim().toLowerCase();
  const match = CARRIER_MAP[cleaned];

  if (match) {
    return { name: match, warning: null };
  }

  // Try partial match
  for (const [key, name] of Object.entries(CARRIER_MAP)) {
    if (cleaned.includes(key)) {
      return { name, warning: `Interpreted "${raw}" as ${name}` };
    }
  }

  // Title case the raw input if no match found
  const titleCased = raw
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return {
    name: titleCased,
    warning: `Carrier "${raw}" not in known database — using as-is`,
  };
}

/**
 * Parse a route string into origin and destination.
 * Handles: "BOG-MIA", "BOG→MIA", "BOG to MIA", "Bogotá – Miami"
 * Mode-aware: uses normalizeLocation for ocean/ground, normalizeIATA for air.
 */
export function parseRoute(
  raw: string,
  mode?: FreightMode,
): {
  origin: string | null;
  destination: string | null;
  warning: string | null;
} {
  const separators = /\s*(?:→|->|–|—|-|to|a|hacia)\s*/i;
  const parts = raw
    .split(separators)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return {
      origin: null,
      destination: null,
      warning: `Could not parse route from "${raw}"`,
    };
  }

  const warnings: string[] = [];

  if (mode && mode !== "air") {
    const originResult = normalizeLocation(parts[0]!, mode);
    const destResult = normalizeLocation(parts[1]!, mode);
    if (originResult.warning) warnings.push(originResult.warning);
    if (destResult.warning) warnings.push(destResult.warning);
    return {
      origin: originResult.code,
      destination: destResult.code,
      warning: warnings.length > 0 ? warnings.join("; ") : null,
    };
  }

  const originResult = normalizeIATA(parts[0]!);
  const destResult = normalizeIATA(parts[1]!);

  if (originResult.warning) warnings.push(originResult.warning);
  if (destResult.warning) warnings.push(destResult.warning);

  return {
    origin: originResult.code,
    destination: destResult.code,
    warning: warnings.length > 0 ? warnings.join("; ") : null,
  };
}
