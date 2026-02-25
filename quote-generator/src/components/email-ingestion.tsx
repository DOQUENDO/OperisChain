/**
 * OperisChain — Email Ingestion Card
 *
 * Shows the inbound email address with a copy button,
 * and displays active/recent email ingestion job statuses.
 */

"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import {
    useEmailJobs,
    type IngestionJob,
} from "@/hooks/use-email-jobs";
import {
    Mail,
    Copy,
    Check,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Clock,
} from "lucide-react";

const INBOUND_EMAIL = "diego.oquendo@operischain.com";

interface EmailIngestionProps {
    clientId: string;
    /** Called when new rates are ready (job done) */
    onRatesReady?: (job: IngestionJob) => void;
}

export function EmailIngestion({ clientId, onRatesReady }: EmailIngestionProps) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const { jobs, activeJobs, hasNewRates } = useEmailJobs({
        clientId,
        enabled: true,
    });

    // Notify parent when a job completes with rates
    const recentDone = jobs.find(
        (j) =>
            j.status === "done" &&
            j.ratesExtracted &&
            j.ratesExtracted > 0 &&
            Date.now() - new Date(j.updatedAt).getTime() < 10_000,
    );
    if (recentDone && onRatesReady) {
        onRatesReady(recentDone);
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(INBOUND_EMAIL);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const input = document.createElement("input");
            input.value = INBOUND_EMAIL;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Only show recent jobs (last 10 minutes)
    const recentJobs = jobs
        .filter(
            (j) =>
                j.source === "email" &&
                Date.now() - new Date(j.createdAt).getTime() < 10 * 60 * 1000,
        )
        .slice(0, 5);

    return (
        <div className="border border-white/10 rounded-xl bg-white/[0.02] p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <Mail size={16} className="text-cyan-400" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold">{t("email.title")}</h3>
                    <p className="text-xs text-white/40">{t("email.subtitle")}</p>
                </div>
            </div>

            {/* Email address with copy button */}
            <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg font-mono text-sm text-cyan-400 select-all">
                    {INBOUND_EMAIL}
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
                >
                    {copied ? (
                        <>
                            <Check size={14} className="text-green-400" />
                            <span className="text-green-400">{t("email.copied")}</span>
                        </>
                    ) : (
                        <>
                            <Copy size={14} className="text-white/50" />
                            <span className="text-white/50">{t("email.copy")}</span>
                        </>
                    )}
                </button>
            </div>

            {/* How it works note */}
            <p className="text-xs text-white/30 flex items-center gap-1.5">
                <Clock size={12} />
                {t("email.howItWorks")}
            </p>

            {/* Active/recent jobs */}
            {recentJobs.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                    <p className="text-[11px] text-white/30 uppercase tracking-wider font-medium">
                        {t("email.recentJobs")}
                    </p>
                    {recentJobs.map((job) => (
                        <JobStatusRow key={job.jobId} job={job} />
                    ))}
                </div>
            )}

            {/* Notification badge when new rates arrive */}
            {hasNewRates && activeJobs.length === 0 && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <CheckCircle2 size={16} className="text-green-400" />
                    <p className="text-sm text-green-400 font-medium">
                        {t("email.jobDone", {
                            count:
                                recentJobs.find((j) => j.status === "done")?.ratesExtracted ??
                                0,
                        })}
                    </p>
                </div>
            )}
        </div>
    );
}

function JobStatusRow({ job }: { job: IngestionJob }) {
    const { t } = useTranslation();

    const statusConfig = {
        pending: {
            icon: <Clock size={14} className="text-yellow-400" />,
            text: t("email.jobPending"),
            textColor: "text-yellow-400",
        },
        processing: {
            icon: <Loader2 size={14} className="text-cyan-400 animate-spin" />,
            text: t("email.jobProcessing"),
            textColor: "text-cyan-400",
        },
        done: {
            icon: <CheckCircle2 size={14} className="text-green-400" />,
            text: t("email.jobDone", {
                count: job.ratesExtracted ?? 0,
            }),
            textColor: "text-green-400",
        },
        failed: {
            icon: <AlertCircle size={14} className="text-red-400" />,
            text: t("email.jobFailed"),
            textColor: "text-red-400",
        },
    };

    const config = statusConfig[job.status];

    return (
        <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2 min-w-0">
                {config.icon}
                <span className="text-xs text-white/60 truncate max-w-[200px]">
                    {job.emailSubject || "Email"}
                </span>
            </div>
            <span className={`text-xs font-medium ${config.textColor}`}>
                {config.text}
            </span>
        </div>
    );
}
