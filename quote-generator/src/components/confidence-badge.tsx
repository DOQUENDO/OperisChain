/**
 * OperisChain — Confidence Badge Component
 * 
 * Visual indicator of extraction confidence level.
 * Green (>=0.8), Yellow (0.7-0.8), Red (<0.7)
 * 
 * Below 0.7 = flag for human review. NEVER silent.
 */

'use client';

import { useTranslation } from '@/lib/i18n';

interface ConfidenceBadgeProps {
    score: number;
    showLabel?: boolean;
    size?: 'sm' | 'md';
}

export function ConfidenceBadge({ score, showLabel = true, size = 'sm' }: ConfidenceBadgeProps) {
    const { t } = useTranslation();
    const percentage = Math.round(score * 100);

    let color: string;
    let bgColor: string;
    let label: string;

    if (score >= 0.8) {
        color = 'text-green-400';
        bgColor = 'bg-green-400/10 border-green-400/20';
        label = t('confidence.high');
    } else if (score >= 0.7) {
        color = 'text-yellow-400';
        bgColor = 'bg-yellow-400/10 border-yellow-400/20';
        label = t('confidence.medium');
    } else {
        color = 'text-red-400';
        bgColor = 'bg-red-400/10 border-red-400/20';
        label = t('confidence.low');
    }

    const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border font-mono ${color} ${bgColor} ${sizeClasses}`}
            title={`Confidence: ${percentage}% — ${label}`}
        >
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${score >= 0.8 ? 'bg-green-400' : score >= 0.7 ? 'bg-yellow-400' : 'bg-red-400'
                }`} />
            {percentage}%
            {showLabel && <span className="font-sans">{label}</span>}
        </span>
    );
}
