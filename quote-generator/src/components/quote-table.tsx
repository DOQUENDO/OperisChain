/**
 * OperisChain — Quote Table Component
 * 
 * Comparative quote table using TanStack Table.
 * 
 * Features:
 * - Highlights recommended carrier row (navy background)
 * - Confidence badge (green/yellow/red) per rate
 * - Surcharge banner if any flags are excluded/unknown
 * - "Exportar PDF" button
 * - If needsClarification: shows question before table
 */

'use client';

import { useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Download, AlertCircle, Star, Clock, DollarSign } from 'lucide-react';
import { ConfidenceBadge } from './confidence-badge';
import { SurchargeBanner } from './surcharge-banner';
import { useTranslation } from '@/lib/i18n';
import type { SurchargeFlag } from '@/lib/db/schema';

export interface QuoteLineDisplay {
    id: string;
    carrier: string;
    route: string;
    priceUSD: number;
    totalPriceUSD?: number;
    unitType?: string;
    transitDays: number | null;
    validUntil: string | null;
    validityWarning: string | null;
    surchargeFlags: SurchargeFlag[];
    confidenceScore: number;
    score: number;
    sourceDocId: string;
}

export interface QuoteDisplay {
    quoteId: string;
    generatedAt: string;
    cargo: {
        origin: string;
        destination: string;
        weightKg: number;
        urgency: 'high' | 'normal' | 'unknown';
    };
    lines: QuoteLineDisplay[];
    recommended: string;
    reasoning: string;
    needsClarification: boolean;
    clarificationQuestion: string | null;
}

interface QuoteTableProps {
    quote: QuoteDisplay;
    onUrgencySelect?: (urgency: 'high' | 'normal') => void;
}

export function QuoteTable({ quote, onUrgencySelect }: QuoteTableProps) {
    const { t } = useTranslation();
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'score', desc: true },
    ]);

    // ─── Clarification Gate ───
    if (quote.needsClarification && quote.clarificationQuestion && onUrgencySelect) {
        return (
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-6">
                <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="text-yellow-400 mt-0.5" size={20} />
                    <div>
                        <h3 className="text-white font-semibold mb-1">{t('clarification.title')}</h3>
                        <p className="text-white/70 text-sm">{quote.clarificationQuestion}</p>
                    </div>
                </div>
                <div className="flex gap-3 ml-8">
                    <button
                        onClick={() => onUrgencySelect('high')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm"
                    >
                        <Clock size={14} /> {t('clarification.urgent')}
                    </button>
                    <button
                        onClick={() => onUrgencySelect('normal')}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors text-sm"
                    >
                        <DollarSign size={14} /> {t('clarification.normal')}
                    </button>
                </div>
            </div>
        );
    }

    const columns: ColumnDef<QuoteLineDisplay>[] = [
        {
            id: 'recommended',
            header: '',
            cell: ({ row }) => (
                row.original.carrier === quote.recommended ? (
                    <Star size={16} className="text-cyan-400 fill-cyan-400" />
                ) : null
            ),
            size: 30,
        },
        {
            accessorKey: 'carrier',
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1 font-semibold"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {t('table.carrier')} <ArrowUpDown size={14} />
                </button>
            ),
        },
        {
            accessorKey: 'route',
            header: t('table.route'),
        },
        {
            accessorKey: 'priceUSD',
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1 font-semibold"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {t('table.price')} <ArrowUpDown size={14} />
                </button>
            ),
            cell: ({ row }) => {
                const hasExcluded = row.original.surchargeFlags.some(
                    s => s.status === 'excluded' || s.status === 'unknown'
                );
                const unitPrice = Number(row.original.priceUSD);
                const totalPrice = row.original.totalPriceUSD != null
                    ? Number(row.original.totalPriceUSD)
                    : unitPrice;
                const unitType = row.original.unitType || 'per_kg';
                const isUnitRate = unitType === 'per_kg' || unitType === 'per_ton' || unitType === 'per_cbm';
                const unitLabel = unitType === 'per_ton' ? '/ton'
                    : unitType === 'per_cbm' ? '/CBM' : '/kg';

                return (
                    <div className="leading-tight">
                        <span className="font-semibold">
                            ${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            {hasExcluded && <span className="text-yellow-400">*</span>}
                        </span>
                        {isUnitRate && totalPrice !== unitPrice && (
                            <span className="block text-xs text-white/40">
                                ${unitPrice.toFixed(2)}{unitLabel}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'transitDays',
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1 font-semibold"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {t('table.transit')} <ArrowUpDown size={14} />
                </button>
            ),
            cell: ({ row }) => (
                row.original.transitDays !== null
                    ? `${row.original.transitDays}d`
                    : <span className="text-white/40">N/A</span>
            ),
        },
        {
            accessorKey: 'validUntil',
            header: t('table.validUntil'),
            cell: ({ row }) => {
                const { validUntil, validityWarning } = row.original;
                if (validUntil) return validUntil;
                return (
                    <span className="text-yellow-400 text-xs" title={validityWarning || ''}>
                        ⚠ {validityWarning ? 'Check' : 'N/A'}
                    </span>
                );
            },
        },
        {
            accessorKey: 'confidenceScore',
            header: t('table.confidence'),
            cell: ({ row }) => (
                <ConfidenceBadge score={row.original.confidenceScore} showLabel={false} />
            ),
        },
        {
            accessorKey: 'score',
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1 font-semibold"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {t('table.score')} <ArrowUpDown size={14} />
                </button>
            ),
            cell: ({ row }) => (
                <span className="font-mono text-cyan-400">
                    {(row.original.score * 100).toFixed(0)}
                </span>
            ),
        },
    ];

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const table = useReactTable({
        data: quote.lines,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    // Check if any line has surcharge issues
    const hasSurchargeIssues = quote.lines.some(l =>
        l.surchargeFlags.some(s => s.status === 'excluded' || s.status === 'unknown')
    );

    return (
        <div className="space-y-4">
            {/* Quote Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">
                        {t('quote.title', { origin: quote.cargo.origin, destination: quote.cargo.destination })}
                    </h2>
                    <p className="text-sm text-white/50">
                        {t('quote.meta', {
                            weight: quote.cargo.weightKg,
                            count: quote.lines.length,
                            date: new Date(quote.generatedAt).toLocaleString(),
                        })}
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium rounded-lg transition-colors">
                    <Download size={16} /> {t('quote.exportPDF')}
                </button>
            </div>

            {/* Surcharge Banner */}
            {hasSurchargeIssues && (
                <SurchargeBanner
                    surcharges={quote.lines.flatMap(l => l.surchargeFlags.filter(s => s.status !== 'included'))}
                />
            )}

            {/* Table */}
            <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id} className="border-b border-white/10 bg-white/5">
                                {headerGroup.headers.map(header => (
                                    <th
                                        key={header.id}
                                        className="px-4 py-3 text-left text-white/60 font-medium text-xs uppercase tracking-wider"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map(row => {
                            const isRecommended = row.original.carrier === quote.recommended;
                            return (
                                <tr
                                    key={row.id}
                                    className={`border-b border-white/5 transition-colors ${isRecommended
                                        ? 'bg-cyan-500/10 hover:bg-cyan-500/15'
                                        : 'hover:bg-white/5'
                                        }`}
                                >
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="px-4 py-3 text-white/80">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Recommendation */}
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div className="flex items-start gap-3">
                    <Star className="text-cyan-400 mt-0.5 shrink-0" size={18} />
                    <div>
                        <h3 className="text-white font-semibold mb-1">
                            {t('quote.recommendation', { carrier: quote.recommended })}
                        </h3>
                        <p className="text-white/70 text-sm leading-relaxed">
                            {quote.reasoning}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
