/**
 * OperisChain — Email Ingestion Hook
 *
 * Polls for recent ingestion jobs for a client.
 * Used by the upload step to show email ingestion status.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface IngestionJob {
  jobId: string;
  status: "pending" | "processing" | "done" | "failed";
  source: string;
  documentId: string | null;
  ratesExtracted: number | null;
  errorMessage: string | null;
  emailSubject: string | null;
  emailFrom: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UseEmailJobsOptions {
  clientId: string;
  /** Polling interval in ms (default: 3000) */
  pollInterval?: number;
  /** Whether polling is active */
  enabled?: boolean;
}

export function useEmailJobs({
  clientId,
  pollInterval = 3000,
  enabled = true,
}: UseEmailJobsOptions) {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!clientId) return;
    try {
      const res = await fetch(
        `/api/ingest/jobs?clientId=${encodeURIComponent(clientId)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setJobs(
        (data.jobs || []).map(
          (j: Record<string, unknown>) =>
            ({
              jobId: j.id,
              status: j.status,
              source: j.source,
              documentId: j.documentId ?? j.document_id,
              ratesExtracted: j.ratesExtracted ?? j.rates_extracted,
              errorMessage: j.errorMessage ?? j.error_message,
              emailSubject: j.emailSubject ?? j.email_subject,
              emailFrom: j.emailFrom ?? j.email_from,
              createdAt: j.createdAt ?? j.created_at,
              updatedAt: j.updatedAt ?? j.updated_at,
            }) as IngestionJob,
        ),
      );
    } catch {
      // Silently fail — polling will retry
    }
  }, [clientId]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      setIsLoading(true);
      fetchJobs().finally(() => setIsLoading(false));
    }
  }, [enabled, fetchJobs]);

  // Polling
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // Only poll if there are active (non-terminal) jobs
    const hasActiveJobs = jobs.some(
      (j) => j.status === "pending" || j.status === "processing",
    );

    if (hasActiveJobs) {
      intervalRef.current = setInterval(fetchJobs, pollInterval);
    } else {
      // Still poll slowly to detect new incoming emails
      intervalRef.current = setInterval(fetchJobs, pollInterval * 3);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, jobs, fetchJobs, pollInterval]);

  // Derived state
  const activeJobs = jobs.filter(
    (j) => j.status === "pending" || j.status === "processing",
  );
  const completedJobs = jobs.filter((j) => j.status === "done");
  const hasNewRates = completedJobs.some(
    (j) =>
      j.ratesExtracted &&
      j.ratesExtracted > 0 &&
      // Only consider jobs from the last 5 minutes as "new"
      Date.now() - new Date(j.updatedAt).getTime() < 5 * 60 * 1000,
  );

  return {
    jobs,
    activeJobs,
    completedJobs,
    hasNewRates,
    isLoading,
    refetch: fetchJobs,
  };
}
