/**
 * OperisChain — Excel/CSV Parser
 *
 * Wrapper around SheetJS (xlsx) for extracting data from
 * Excel spreadsheets and CSV files containing carrier rates.
 */

import * as XLSX from "xlsx";

export interface ParsedExcel {
  text: string; // All data as concatenated text
  sheets: SheetData[]; // Structured per-sheet data
  totalRows: number;
}

export interface SheetData {
  name: string;
  headers: string[];
  rows: Record<string, unknown>[];
  rawText: string;
}

/**
 * Extract data from an Excel or CSV buffer.
 *
 * Returns both structured data (rows/columns) and a text representation
 * suitable for LLM processing.
 *
 * @param buffer - The file as a Buffer
 * @param fileName - Original file name (for type detection)
 */
export function parseExcel(buffer: Buffer, _fileName?: string): ParsedExcel {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheets: SheetData[] = [];
  let totalRows = 0;

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Get as JSON (array of objects with headers as keys)
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

    // Get headers
    const headers = rows.length > 0 ? Object.keys(rows[0]!) : [];

    // Generate text representation for LLM processing
    const rawText = XLSX.utils.sheet_to_csv(worksheet);

    sheets.push({
      name: sheetName,
      headers,
      rows,
      rawText,
    });

    totalRows += rows.length;
  }

  // Concatenate all sheet text for full-document processing
  const text = sheets
    .map((s) => {
      return `--- Sheet: ${s.name} ---\n${s.rawText}`;
    })
    .join("\n\n");

  return { text, sheets, totalRows };
}

/**
 * Extract from file path (server-side).
 */
export function parseExcelFromPath(filePath: string): ParsedExcel {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs") as typeof import("fs");
  const buffer = fs.readFileSync(filePath);
  return parseExcel(buffer, filePath);
}
