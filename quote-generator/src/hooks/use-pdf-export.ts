/**
 * OperisChain — PDF Export Hook
 *
 * React hook wrapping the PDF generation service.
 * Handles loading state, error handling, and lazy-loading of jsPDF.
 *
 * Usage:
 *   const { exportPdf, isExporting, error } = usePdfExport();
 *   <button onClick={() => exportPdf(quote, locale)} disabled={isExporting}>
 */

"use client";

import { useState, useCallback } from "react";
import type { QuoteDisplay } from "@/components/quote-table";
import type { Locale } from "@/lib/i18n";
import type { PdfOptions } from "@/lib/pdf/quote-pdf";

interface UsePdfExportReturn {
  /** Trigger PDF generation and download */
  exportPdf: (
    quote: QuoteDisplay,
    locale: Locale,
    options?: PdfOptions,
  ) => Promise<void>;
  /** True while PDF is being generated */
  isExporting: boolean;
  /** Error message if generation failed */
  error: string | null;
  /** Clear the error state */
  clearError: () => void;
}

export function usePdfExport(): UsePdfExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const exportPdf = useCallback(
    async (quote: QuoteDisplay, locale: Locale, options: PdfOptions = {}) => {
      setIsExporting(true);
      setError(null);

      try {
        // Dynamic import — only loads jsPDF when user clicks export
        // This keeps the initial bundle small (~0 KB for PDF until needed)
        const { generateQuotePdf } = await import("@/lib/pdf/quote-pdf");

        generateQuotePdf(quote, locale, {
          action: "save",
          ...options,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to generate PDF";
        console.error("PDF export error:", err);
        setError(message);
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  return { exportPdf, isExporting, error, clearError };
}
