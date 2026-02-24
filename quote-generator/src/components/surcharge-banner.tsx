/**
 * OperisChain — Surcharge Banner Component
 * 
 * Visible banner for surcharge warnings.
 * NEVER hides surcharge issues from the user.
 * 
 * Critical (red): Surcharges explicitly excluded
 * Warning (yellow): Surcharge status unknown
 * Info (green): All surcharges included
 */

'use client';

import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { SurchargeFlag } from '@/lib/db/schema';
import { SURCHARGE_NAMES } from '@/lib/surcharges';
import { useTranslation } from '@/lib/i18n';

interface SurchargeBannerProps {
    surcharges: SurchargeFlag[];
    compact?: boolean;
}

/**
 * Build the translated warning message + severity level from surcharge flags.
 * Mirrors the logic from getSurchargeWarnings() but uses the i18n `t()` helper.
 */
function useTranslatedWarning(surcharges: SurchargeFlag[]) {
    const { t } = useTranslation();

    if (!surcharges || surcharges.length === 0) {
        return {
            level: 'warning' as const,
            message: t('surcharge.noInfo'),
            footnote: null as string | null,
            flagged: [] as SurchargeFlag[],
        };
    }

    const excluded = surcharges.filter((s) => s.status === 'excluded');
    const unknown = surcharges.filter((s) => s.status === 'unknown');
    const included = surcharges.filter((s) => s.status === 'included');

    // All included — great
    if (excluded.length === 0 && unknown.length === 0) {
        const names = included.map((s) => SURCHARGE_NAMES[s.type] || s.type).join(', ');
        return {
            level: 'info' as const,
            message: t('surcharge.allIncluded').replace('{names}', names),
            footnote: null as string | null,
            flagged: included,
        };
    }

    // Some excluded — critical
    if (excluded.length > 0) {
        const excludedNames = excluded.map((s) => SURCHARGE_NAMES[s.type] || s.type).join(', ');
        const unknownPart = unknown.length > 0
            ? t('surcharge.unknownAdditional').replace('{names}', unknown.map((s) => SURCHARGE_NAMES[s.type] || s.type).join(', '))
            : '';
        const msg = t('surcharge.excluded').replace('{names}', excludedNames) + unknownPart + t('surcharge.verifyTotal');

        // Footnote
        const parts: string[] = [];
        parts.push(t('surcharge.notIncluded').replace('{names}', excluded.map((s) => s.type).join(', ')));
        if (unknown.length > 0) {
            parts.push(t('surcharge.unconfirmed').replace('{names}', unknown.map((s) => s.type).join(', ')));
        }

        return {
            level: 'critical' as const,
            message: msg,
            footnote: `* ${parts.join('. ')}`,
            flagged: [...excluded, ...unknown],
        };
    }

    // Some unknown — warning
    const unknownNames = unknown.map((s) => SURCHARGE_NAMES[s.type] || s.type).join(', ');
    const footnoteParts = [t('surcharge.unconfirmed').replace('{names}', unknown.map((s) => s.type).join(', '))];

    return {
        level: 'warning' as const,
        message: t('surcharge.unknownFor').replace('{names}', unknownNames),
        footnote: `* ${footnoteParts.join('. ')}`,
        flagged: unknown,
    };
}

export function SurchargeBanner({ surcharges, compact = false }: SurchargeBannerProps) {
    const { t } = useTranslation();
    const { level, message, footnote, flagged } = useTranslatedWarning(surcharges);

    if (level === 'info' && compact) {
        return null; // Don't show banner when all is good in compact mode
    }

    const config = {
        critical: {
            icon: AlertTriangle,
            bgColor: 'bg-red-500/10 border-red-500/20',
            textColor: 'text-red-400',
            iconColor: 'text-red-400',
        },
        warning: {
            icon: AlertCircle,
            bgColor: 'bg-yellow-500/10 border-yellow-500/20',
            textColor: 'text-yellow-400',
            iconColor: 'text-yellow-400',
        },
        info: {
            icon: CheckCircle2,
            bgColor: 'bg-green-500/10 border-green-500/20',
            textColor: 'text-green-400',
            iconColor: 'text-green-400',
        },
    }[level];

    const Icon = config.icon;
    const statusLabels: Record<string, string> = {
        excluded: t('surcharge.statusExcluded'),
        unknown: t('surcharge.statusUnknown'),
        included: t('surcharge.statusIncluded'),
    };

    if (compact) {
        return (
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs ${config.bgColor} ${config.textColor}`}>
                <Icon size={12} className={config.iconColor} />
                {footnote || message}
            </div>
        );
    }

    return (
        <div className={`flex items-start gap-3 p-3 rounded-lg border ${config.bgColor}`}>
            <Icon size={18} className={`${config.iconColor} mt-0.5 shrink-0`} />
            <div className="flex-1">
                <p className={`text-sm font-medium ${config.textColor}`}>
                    {message}
                </p>
                {footnote && (
                    <p className={`text-xs mt-1 ${config.textColor} opacity-80`}>
                        {footnote}
                    </p>
                )}
                {flagged.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {flagged.map((s, i) => (
                            <span
                                key={i}
                                className={`text-xs px-2 py-0.5 rounded-full border ${s.status === 'excluded'
                                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                    }`}
                            >
                                {s.type}: {statusLabels[s.status] || s.status}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
