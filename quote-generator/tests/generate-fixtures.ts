/**
 * OperisChain — Test Fixture Generator
 *
 * Generates realistic mock PDFs and Excel files for testing
 * the Quote Generator extraction pipeline.
 *
 * Usage: npx tsx tests/generate-fixtures.ts
 */

import XLSX from "xlsx";
import fs from "fs";
import path from "path";

const FIXTURES_DIR = path.resolve(__dirname, "fixtures");

// ─────────────────────────────────────────────
// PDF Text Content (we save as .txt for pdf-parse testing,
// since generating real PDFs needs a heavier lib.
// The seed script will ingest them as "text" type.)
// ─────────────────────────────────────────────

const pdfContents: Record<string, string> = {
  "04-fedex-ratecard.txt": `
══════════════════════════════════════════════════════════
                 FEDEX INTERNATIONAL PRIORITY
                  AIR FREIGHT RATE CARD 2026
══════════════════════════════════════════════════════════

Effective Date: February 1, 2026
Expiration: March 31, 2026
Region: Colombia (CO) — Outbound
Currency: USD
Account: OperisChain Logistics SAS

─── ROUTE: BOG → MIA (Bogotá to Miami) ────────────────

Weight Break (kg)    Rate (USD/kg)    Transit (days)
─────────────────    ─────────────    ──────────────
Min - 45             4.20             1-2
45 - 100             3.10             1-2
100 - 300            2.75             2
300 - 500            2.40             2
500 - 1000           2.10             2-3
1000+                1.85             3

Surcharges (applied per kg, in addition to base rate):
  • Fuel Surcharge (FSC):     USD 0.42/kg — NOT INCLUDED
  • Security Surcharge:       USD 0.08/kg — NOT INCLUDED
  • BAF:                      INCLUDED in base rate
  • Handling (Origin):        USD 0.25/kg — NOT INCLUDED

─── ROUTE: BOG → JFK (Bogotá to New York) ─────────────

Weight Break (kg)    Rate (USD/kg)    Transit (days)
─────────────────    ─────────────    ──────────────
Min - 45             4.50             2
45 - 100             3.35             2
100 - 300            2.95             2
300 - 500            2.60             2-3
500 - 1000           2.30             3
1000+                2.05             3

Surcharges: Same as BOG-MIA route above.

─── ROUTE: MDE → MIA (Medellín to Miami) ──────────────

Weight Break (kg)    Rate (USD/kg)    Transit (days)
─────────────────    ─────────────    ──────────────
Min - 45             4.40             2
45 - 100             3.25             2
100 - 300            2.85             2
300 - 500            2.50             2-3
500 - 1000           2.20             3
1000+                1.95             3

Surcharges: Same as BOG-MIA route above.

═══════════════════════════════════════════════════════
Terms & Conditions:
  - Rates are door-to-airport unless otherwise specified
  - Chargeable weight = max(actual, volumetric)
  - Volumetric factor: 6000 cm³ = 1 kg
  - Hazmat/DG shipments: add 50% surcharge
  - Rates subject to space availability
═══════════════════════════════════════════════════════
`,

  "05-cargolux-contract.txt": `
CARGOLUX AIRLINES INTERNATIONAL
CONTRACT RATE AGREEMENT

Contract No: CX-2026-0342
Customer: OperisChain Logistics SAS
Valid From: 01-JAN-2026
Valid To: 30-JUN-2026

Dear Customer,

Please find below the agreed contract rates for the period indicated above.

ORIGIN: BOG (El Dorado International Airport, Bogotá)
DESTINATION: AMS (Amsterdam Schiphol Airport)

Kg Bracket       USD/kg    Transit
0 - 100          4.80      4-5 days
100 - 300        4.10      4-5 days
300 - 500        3.65      4-5 days
500 - 1000       3.20      5 days
1000 - 2000      2.85      5 days
2000+            2.50      5-6 days

ORIGIN: BOG
DESTINATION: FRA (Frankfurt am Main Airport)

Kg Bracket       USD/kg    Transit
0 - 100          4.90      4-5 days
100 - 300        4.20      4-5 days
300 - 500        3.75      4-5 days
500 - 1000       3.30      5 days
1000 - 2000      2.95      5 days
2000+            2.60      5-6 days

SURCHARGES (applicable to all routes):
  FSC: INCLUDED
  BAF: INCLUDED
  PSS: NOT APPLICABLE (off-peak)
  Handling: EUR 0.18/kg — EXCLUDED
  AMS Terminal Handling: EUR 0.22/kg — EXCLUDED
  FRA Terminal Handling: EUR 0.25/kg — EXCLUDED

All rates are in USD per kilogram.
Rates are for general cargo only.
Perishables, live animals, and valuables subject to separate quotation.

For any questions, please contact:
  Jean-Claude Weber
  Senior Account Manager
  jc.weber@cargolux.com
  +352 4211 3500
`,

  "06-tampa-cargo-circular.txt": `
                    TAMPA CARGO S.A.
              Circular de Tarifas No. 2026-03
              Fecha de emisión: 10 de febrero 2026

Apreciados clientes,

Nos permitimos informar las tarifas de carga aérea vigentes
para nuestras rutas nacionales e internacionales desde Bogotá.

╔════════════════════════════════════════════════════════════╗
║  RUTA NACIONAL: BOG - MDE (Bogotá - Medellín)            ║
╠════════════════════════════════════════════════════════════╣
║  Peso         │ Tarifa COP/kg  │ Tránsito                ║
║  < 50 kg      │    3,200       │ Mismo día               ║
║  50-200 kg    │    2,800       │ Mismo día               ║
║  200-500 kg   │    2,400       │ 1 día                   ║
║  > 500 kg     │    2,100       │ 1 día                   ║
╠════════════════════════════════════════════════════════════╣
║  Recargos: TODO INCLUIDO                                  ║
║  Vigencia: Hasta nuevo aviso                              ║
╚════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════╗
║  RUTA INTERNACIONAL: BOG - PTY (Bogotá - Panamá)         ║
╠════════════════════════════════════════════════════════════╣
║  Peso         │ Tarifa USD/kg  │ Tránsito                ║
║  < 100 kg     │    2.60        │ 1 día                   ║
║  100-300 kg   │    2.25        │ 1-2 días                ║
║  300-500 kg   │    1.95        │ 2 días                  ║
║  > 500 kg     │    1.70        │ 2 días                  ║
╠════════════════════════════════════════════════════════════╣
║  Recargos:                                                ║
║    FSC: Incluido                                          ║
║    BAF: Incluido                                          ║
║    Handling: USD 0.12/kg - No incluido                    ║
║  Vigencia: 31/03/2026                                     ║
╚════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════╗
║  RUTA INTERNACIONAL: BOG - LIM (Bogotá - Lima)           ║
╠════════════════════════════════════════════════════════════╣
║  Peso         │ Tarifa USD/kg  │ Tránsito                ║
║  < 100 kg     │    2.90        │ 2 días                  ║
║  100-300 kg   │    2.50        │ 2 días                  ║
║  300-500 kg   │    2.15        │ 2-3 días                ║
║  > 500 kg     │    1.90        │ 3 días                  ║
╠════════════════════════════════════════════════════════════╣
║  Recargos:                                                ║
║    FSC: USD 0.30/kg - No incluido                         ║
║    BAF: Incluido                                          ║
║    Handling: USD 0.15/kg - No incluido                    ║
║  Vigencia: 31/03/2026                                     ║
╚════════════════════════════════════════════════════════════╝

Para cotizaciones especiales y carga sobredimensionada,
favor comunicarse con el departamento comercial.

Atentamente,
Departamento de Tarifas
Tampa Cargo S.A.
PBX: +57 604 562 2828
`,

  "11-seaboard-ocean-lcl-es.txt": `
══════════════════════════════════════════════════════════
         SEABOARD MARINE — OCEAN LCL RATE CARD
        Colombia → Caribbean / Central America 2026
══════════════════════════════════════════════════════════

Fecha Efectiva: 1 de Marzo, 2026
Vencimiento: 30 de Abril, 2026
Servicio: LCL Consolidado
Moneda: USD
Cliente: OperisChain Logistics SAS

─── RUTA: COCLO → PAPTY (Cartagena → Ciudad de Panamá) ────

Peso/Volumen          Tarifa USD        Tránsito (días)
────────────────      ───────────       ───────────────
Por CBM               USD 85/CBM        5-7
Por tonelada (1000kg) USD 45/ton        5-7
Mínimo facturable     USD 150           5-7

─── RUTA: COCLO → JMKIN (Cartagena → Kingston, Jamaica) ───

Peso/Volumen          Tarifa USD        Tránsito (días)
────────────────      ───────────       ───────────────
Por CBM               USD 110/CBM       7-10
Por tonelada          USD 55/ton        7-10
Mínimo facturable     USD 175           7-10

─── RUTA: COBUN → USHOU (Buenaventura → Houston) ─────────

Peso/Volumen          Tarifa USD        Tránsito (días)
────────────────      ───────────       ───────────────
Por CBM               USD 130/CBM       10-14
Por tonelada          USD 65/ton        10-14
Mínimo facturable     USD 200           10-14

─── RUTA: COBUN → USMIA (Buenaventura → Miami) ───────────

Peso/Volumen          Tarifa USD        Tránsito (días)
────────────────      ───────────       ───────────────
Por CBM               USD 120/CBM       8-12
Por tonelada          USD 60/ton        8-12
Mínimo facturable     USD 185           8-12

Recargos (aplican por embarque):
  • BAF (Bunker):            USD 35/CBM — NO INCLUIDO
  • THC Origen (Cartagena):  USD 25/CBM — NO INCLUIDO
  • THC Origen (B/ventura):  USD 22/CBM — NO INCLUIDO
  • THC Destino:             Variable según puerto — NO INCLUIDO
  • ISPS:                    USD 8/BL — INCLUIDO
  • Documentation (BL Fee):  USD 65/BL — NO INCLUIDO
  • Customs clearance:       Por cuenta del cliente
  • Seguro de carga:         0.45% valor declarado — NO INCLUIDO

Notas:
- Se aplica la mayor entre peso y volumen (1 CBM = 1000 kg)
- Frecuencia: Semanal desde Cartagena, quincenal desde Buenaventura
- CFS Cut-off: 3 días antes de zarpe
- Mercancía peligrosa: consultar caso por caso

Tarifas sujetas a disponibilidad de espacio y equipo.

Contacto: ventas@seaboardmarine.com | +57 605 660 2200
`,
};

// ─────────────────────────────────────────────
// Excel Workbooks
// ─────────────────────────────────────────────

function createExcelFixtures() {
  // ── Excel 1: Clean single-carrier rate sheet ──
  const wb1 = XLSX.utils.book_new();

  const ratesData1 = [
    ["COPA CARGO - TARIFA AÉREA 2026"],
    ["Actualización: Febrero 15, 2026"],
    ["Vigencia: Hasta 30/04/2026"],
    [],
    [
      "Ruta",
      "Peso Min (kg)",
      "Peso Max (kg)",
      "Tarifa USD/kg",
      "Tránsito (días)",
      "FSC",
      "BAF",
      "Handling",
    ],
    ["BOG-PTY", 0, 45, 3.2, 1, "Incluido", "Incluido", "USD 0.10/kg"],
    ["BOG-PTY", 45, 100, 2.8, 1, "Incluido", "Incluido", "USD 0.10/kg"],
    ["BOG-PTY", 100, 300, 2.45, 1, "Incluido", "Incluido", "USD 0.10/kg"],
    ["BOG-PTY", 300, 500, 2.15, 2, "Incluido", "Incluido", "USD 0.10/kg"],
    ["BOG-PTY", 500, 1000, 1.9, 2, "Incluido", "Incluido", "USD 0.10/kg"],
    [],
    ["BOG-MEX", 0, 45, 3.6, 2, "Incluido", "Incluido", "USD 0.15/kg"],
    ["BOG-MEX", 45, 100, 3.15, 2, "Incluido", "Incluido", "USD 0.15/kg"],
    ["BOG-MEX", 100, 300, 2.75, 2, "Incluido", "Incluido", "USD 0.15/kg"],
    ["BOG-MEX", 300, 500, 2.4, 3, "Incluido", "Incluido", "USD 0.15/kg"],
    ["BOG-MEX", 500, 1000, 2.1, 3, "Incluido", "Incluido", "USD 0.15/kg"],
    [],
    [
      "BOG-GRU",
      0,
      45,
      3.9,
      3,
      "No incluido USD 0.38/kg",
      "Incluido",
      "USD 0.20/kg",
    ],
    [
      "BOG-GRU",
      45,
      100,
      3.4,
      3,
      "No incluido USD 0.38/kg",
      "Incluido",
      "USD 0.20/kg",
    ],
    [
      "BOG-GRU",
      100,
      300,
      2.95,
      3,
      "No incluido USD 0.38/kg",
      "Incluido",
      "USD 0.20/kg",
    ],
    [
      "BOG-GRU",
      300,
      500,
      2.6,
      3,
      "No incluido USD 0.38/kg",
      "Incluido",
      "USD 0.20/kg",
    ],
    [
      "BOG-GRU",
      500,
      1000,
      2.3,
      4,
      "No incluido USD 0.38/kg",
      "Incluido",
      "USD 0.20/kg",
    ],
    [],
    ["Notas:"],
    ["- Peso volumétrico: L x A x H (cm) / 6000"],
    ["- Tarifas no aplican para carga peligrosa"],
    ["- Sujeto a disponibilidad de espacio"],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(ratesData1);
  XLSX.utils.book_append_sheet(wb1, ws1, "Tarifas");

  const excelPath1 = path.join(
    FIXTURES_DIR,
    "excel",
    "07-copa-cargo-rates.xlsx",
  );
  XLSX.writeFile(wb1, excelPath1);
  console.log(`✓ Created: ${excelPath1}`);

  // ── Excel 2: Multi-sheet, multi-carrier comparison ──
  const wb2 = XLSX.utils.book_new();

  // Sheet 1: Comparativo BOG-MIA
  const compareData = [
    ["COMPARATIVO DE TARIFAS BOG → MIA — Febrero 2026"],
    ["Preparado por: Equipo Comercial OperisChain"],
    [],
    [
      "Carrier",
      "45-100 kg",
      "100-300 kg",
      "300-500 kg",
      "500-1000 kg",
      "1000+ kg",
      "Tránsito",
      "Vigencia",
      "FSC Incluido?",
    ],
    [
      "Avianca Cargo",
      2.85,
      2.45,
      2.15,
      1.95,
      1.75,
      "2-3 días",
      "31/03/2026",
      "No",
    ],
    ["FedEx", 3.1, 2.75, 2.4, 2.1, 1.85, "1-2 días", "31/03/2026", "No"],
    ["DHL Express", 2.9, 2.5, 2.2, null, null, "2 días", "Fin de mes", "No"],
    ["Tampa Cargo", null, null, null, null, null, null, null, null],
    [],
    ["Notas:"],
    [
      "* DHL solo cotizó hasta 300kg, falta confirmación de brackets superiores",
    ],
    ["* Tampa Cargo no tiene ruta directa BOG-MIA"],
    ["* FedEx ofrece tránsito más rápido pero tarifa más alta"],
    ["* Valores en USD/kg"],
  ];

  const wsCompare = XLSX.utils.aoa_to_sheet(compareData);
  XLSX.utils.book_append_sheet(wb2, wsCompare, "BOG-MIA Comparativo");

  // Sheet 2: Comparativo BOG-SCL
  const compareSCL = [
    ["COMPARATIVO DE TARIFAS BOG → SCL — Febrero 2026"],
    [],
    [
      "Carrier",
      "Hasta 100 kg",
      "100-500 kg",
      "500-1000 kg",
      "1000+ kg",
      "Tránsito",
      "Vigencia",
      "Notas",
    ],
    [
      "LATAM Cargo",
      3.1,
      2.7,
      2.35,
      2.1,
      "1-2 días",
      "Hasta nuevo aviso",
      "FSC incluido",
    ],
    [
      "Avianca Cargo",
      3.3,
      2.85,
      2.5,
      2.25,
      "2 días",
      "31/03/2026",
      "FSC no incluido",
    ],
    [],
    ["LATAM tiene ruta directa, Avianca hace conexión en Lima"],
  ];

  const wsSCL = XLSX.utils.aoa_to_sheet(compareSCL);
  XLSX.utils.book_append_sheet(wb2, wsSCL, "BOG-SCL Comparativo");

  // Sheet 3: Histórico (for context)
  const historico = [
    ["HISTÓRICO DE TARIFAS BOG-MIA (USD/kg, bracket 100-300kg)"],
    [],
    ["Mes", "Avianca", "FedEx", "DHL", "Promedio"],
    ["Oct 2025", 2.55, 2.9, 2.65, 2.7],
    ["Nov 2025", 2.5, 2.85, 2.6, 2.65],
    ["Dic 2025", 2.8, 3.15, 2.9, 2.95],
    ["Ene 2026", 2.6, 2.95, 2.7, 2.75],
    ["Feb 2026", 2.45, 2.75, 2.5, 2.57],
  ];

  const wsHist = XLSX.utils.aoa_to_sheet(historico);
  XLSX.utils.book_append_sheet(wb2, wsHist, "Histórico");

  const excelPath2 = path.join(
    FIXTURES_DIR,
    "excel",
    "08-multi-carrier-comparison.xlsx",
  );
  XLSX.writeFile(wb2, excelPath2);
  console.log(`✓ Created: ${excelPath2}`);

  // ─── Fixture 12: Multi-modal comparison (Spanish) ───
  const wb3 = XLSX.utils.book_new();

  // Sheet 1: Comparativo Multimodal BOG → MIA
  const multiModal = [
    ["COMPARATIVO MULTIMODAL — BOGOTÁ → MIAMI"],
    ["Cliente: OperisChain | Peso: 2,500 kg | Fecha: Marzo 2026"],
    [],
    [
      "Modo",
      "Carrier",
      "Ruta",
      "Tipo",
      "Tarifa USD",
      "Tránsito",
      "Vigencia",
      "Recargos",
    ],
    [
      "Aéreo",
      "Avianca Cargo",
      "BOG → MIA",
      "Carga general",
      "USD 1.95/kg",
      "2 días",
      "31/03/2026",
      "FSC no incluido, BAF incluido",
    ],
    [
      "Aéreo",
      "FedEx",
      "BOG → MIA",
      "Priority",
      "USD 2.10/kg",
      "1-2 días",
      "31/03/2026",
      "FSC + Handling no incluido",
    ],
    [
      "Marítimo FCL",
      "Maersk",
      "COBUN → USMIA (vía CTG)",
      "40' HC",
      "USD 4,150",
      "15-18 días",
      "30/04/2026",
      "BAF + THC no incluido",
    ],
    [
      "Marítimo LCL",
      "Seaboard Marine",
      "COBUN → USMIA",
      "Consolidado",
      "USD 120/CBM",
      "8-12 días",
      "30/04/2026",
      "BAF + THC + BL no incluido",
    ],
    [
      "Terrestre+Marítimo",
      "Coordinadora + Seaboard",
      "BOG → BUN → MIA",
      "Multimodal",
      "USD 3,200 total",
      "12-16 días",
      "30/04/2026",
      "Seguro no incluido",
    ],
    [
      "Courier",
      "DHL Express",
      "BOG → MIA",
      "Express",
      "USD 8.50/kg",
      "1 día",
      "28/02/2026",
      "Todo incluido",
    ],
    [],
    [
      "Nota: Aéreo recomendado para carga urgente, marítimo para volumen alto, courier solo para muestras",
    ],
  ];

  const wsMulti = XLSX.utils.aoa_to_sheet(multiModal);
  XLSX.utils.book_append_sheet(wb3, wsMulti, "Multimodal BOG-MIA");

  // Sheet 2: Terrestre Colombia
  const terrestre = [
    ["TARIFAS TERRESTRE NACIONAL — ENVÍA / TCC / COORDINADORA"],
    ["Carga parcial LTL — COP/kg | Marzo 2026"],
    [],
    [
      "Ruta",
      "Envía (COP/kg)",
      "TCC (COP/kg)",
      "Coordinadora (COP/kg)",
      "Tránsito",
    ],
    ["BOG → MDE", 380, 370, 350, "24-36 hrs"],
    ["BOG → CLO", 450, 440, 420, "24-36 hrs"],
    ["BOG → BAQ", 600, 620, 580, "36-48 hrs"],
    ["BOG → CTG", 560, 580, 550, "36-48 hrs"],
    ["BOG → BGA", 320, 310, 300, "12-18 hrs"],
    ["MDE → CLO", 420, 430, 400, "24-36 hrs"],
    [],
    ["Peajes: no incluidos | Seguro: no incluido | Mínimo: 50 kg"],
  ];

  const wsTerr = XLSX.utils.aoa_to_sheet(terrestre);
  XLSX.utils.book_append_sheet(wb3, wsTerr, "Terrestre Nacional");

  const excelPath3 = path.join(
    FIXTURES_DIR,
    "excel",
    "12-multimodal-comparison-es.xlsx",
  );
  XLSX.writeFile(wb3, excelPath3);
  console.log(`✓ Created: ${excelPath3}`);
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

async function main() {
  console.log("🏗️  Generating OperisChain test fixtures...\n");

  // Create directories
  const dirs = ["emails", "pdfs", "excel"];
  for (const dir of dirs) {
    const dirPath = path.join(FIXTURES_DIR, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // Write PDF text fixtures
  for (const [filename, content] of Object.entries(pdfContents)) {
    const filePath = path.join(FIXTURES_DIR, "pdfs", filename);
    fs.writeFileSync(filePath, content.trim(), "utf-8");
    console.log(`✓ Created: ${filePath}`);
  }

  // Write Excel fixtures
  createExcelFixtures();

  console.log("\n✅ All fixtures generated!");
  console.log("\nFixture summary:");
  console.log(
    "  📧 5 email files (.eml) — 3 air (orig) + 1 ocean FCL (ES) + 1 ground (ES)",
  );
  console.log("  📄 4 PDF text files (.txt) — 3 air (orig) + 1 ocean LCL (ES)");
  console.log(
    "  📊 3 Excel files (.xlsx) — 2 air (orig) + 1 multimodal comparison (ES)",
  );
  console.log("\nTotal: 12 test documents ready for ingestion.");
}

main().catch(console.error);
