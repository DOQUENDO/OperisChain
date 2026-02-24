/**
 * OperisChain — PDF Parser
 *
 * Wrapper around pdf-parse for extracting text from PDF documents.
 * Handles carrier rate PDFs, invoices, BLs, air waybills, certificates.
 */

import pdf from "pdf-parse";

export interface ParsedPDF {
  text: string;
  pageCount: number;
  info: Record<string, unknown>;
}

/**
 * Extract text content from a PDF buffer.
 *
 * @param buffer - The PDF file as a Buffer
 * @returns Parsed text content and metadata
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedPDF> {
  const data = await pdf(buffer);

  return {
    text: data.text.trim(),
    pageCount: data.numpages,
    info: data.info as Record<string, unknown>,
  };
}

/**
 * Extract text from a PDF file path (for server-side use).
 */
export async function parsePDFFromPath(filePath: string): Promise<ParsedPDF> {
  const fs = await import("fs");
  const buffer = fs.readFileSync(filePath);
  return parsePDF(buffer);
}
