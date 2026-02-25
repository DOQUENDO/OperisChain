/**
 * OperisChain — Quote Generator Dashboard
 * 
 * Main page for the Quote Generator module.
 * Multi-modal (air, ocean, ground, rail, courier) with ES/EN i18n.
 * Flow:
 * 1. Upload carrier rate documents (PDF, Excel, email)
 * 2. Define cargo parameters (origin, destination, weight, urgency, mode)
 * 3. Generate comparative quote
 * 4. Review with confidence scores and surcharge warnings
 * 5. Export to PDF
 */

'use client';

import { useState } from 'react';
import { UploadZone, type UploadResult } from '@/components/upload-zone';
import { QuoteTable, type QuoteDisplay } from '@/components/quote-table';
import { EmailIngestion } from '@/components/email-ingestion';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from '@/lib/i18n';
import { FileText, Zap, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import type { FreightMode } from '@/lib/db/schema';

// Demo client ID for development (seeded test client)
const DEMO_CLIENT_ID = 'ca99cf7d-0899-4ded-af9f-20338015c0a1';

type Step = 'upload' | 'configure' | 'generating' | 'result';

// Mode options with labels
const MODE_OPTIONS: { value: FreightMode; labelKey: string }[] = [
    { value: 'air', labelKey: 'configure.modeAir' },
    { value: 'ocean_fcl', labelKey: 'configure.modeOceanFCL' },
    { value: 'ocean_lcl', labelKey: 'configure.modeOceanLCL' },
    { value: 'ground_ftl', labelKey: 'configure.modeGroundFTL' },
    { value: 'ground_ltl', labelKey: 'configure.modeGroundLTL' },
    { value: 'rail', labelKey: 'configure.modeRail' },
    { value: 'courier', labelKey: 'configure.modeCourier' },
    { value: 'multimodal', labelKey: 'configure.modeMultimodal' },
];

// Container type options (shown for ocean/ground modes)
const CONTAINER_OPTIONS = [
    { value: 'na', label: 'N/A' },
    { value: '20ft', label: "20'" },
    { value: '40ft', label: "40'" },
    { value: '40hc', label: "40' HC" },
    { value: '45ft', label: "45'" },
    { value: 'reefer_20', label: "Reefer 20'" },
    { value: 'reefer_40', label: "Reefer 40'" },
    { value: 'flat_rack', label: 'Flat Rack' },
    { value: 'open_top', label: 'Open Top' },
    { value: 'ftl_truck', label: 'FTL Truck' },
    { value: 'ltl_pallet', label: 'LTL Pallet' },
];

export default function QuotesPage() {
    const { t } = useTranslation();
    const [step, setStep] = useState<Step>('upload');
    const [uploadedDocs, setUploadedDocs] = useState<UploadResult[]>([]);
    const [quote, setQuote] = useState<QuoteDisplay | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Cargo configuration
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [weightKg, setWeightKg] = useState('');
    const [urgency, setUrgency] = useState<'high' | 'normal' | 'unknown'>('unknown');
    const [mode, setMode] = useState<FreightMode>('air');
    const [containerType, setContainerType] = useState('na');
    const [description, setDescription] = useState('');

    const showContainerSelector = ['ocean_fcl', 'ocean_lcl'].includes(mode);

    const handleDocumentUploaded = (result: UploadResult) => {
        setUploadedDocs(prev => [...prev, result]);
    };

    const handleGenerateQuote = async () => {
        setStep('generating');
        setError(null);

        try {
            const res = await fetch('/api/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    origin,
                    destination,
                    weightKg: parseFloat(weightKg),
                    urgency,
                    mode,
                    containerType: showContainerSelector ? containerType : 'na',
                    clientId: DEMO_CLIENT_ID,
                    description: description || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || data.message || 'Failed to generate quote');
            }

            setQuote(data.quote);
            setStep('result');
        } catch (err) {
            setError(String(err));
            setStep('configure');
        }
    };

    const handleUrgencySelect = async (newUrgency: 'high' | 'normal') => {
        setUrgency(newUrgency);
        setStep('generating');
        setError(null);

        try {
            const res = await fetch('/api/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    origin,
                    destination,
                    weightKg: parseFloat(weightKg),
                    urgency: newUrgency,
                    mode,
                    containerType: showContainerSelector ? containerType : 'na',
                    clientId: DEMO_CLIENT_ID,
                    description: description || undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.message);

            setQuote(data.quote);
            setStep('result');
        } catch (err) {
            setError(String(err));
            setStep('result');
        }
    };

    const handleReset = () => {
        setStep('upload');
        setUploadedDocs([]);
        setQuote(null);
        setError(null);
        setOrigin('');
        setDestination('');
        setWeightKg('');
        setUrgency('unknown');
        setMode('air');
        setContainerType('na');
        setDescription('');
    };

    return (
        <div className="min-h-screen bg-[#06060b] text-white">
            {/* Header */}
            <header className="border-b border-white/10 bg-[#0c0c14]">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Image src="/logo-icon.png" alt="OperisChain Logo" width={32} height={32} />
                        <div>
                            <h1 className="text-lg font-bold">
                                Operis<span className="text-cyan-400">Chain</span>
                            </h1>
                            <p className="text-xs text-white/40">{t('app.subtitle')}</p>
                        </div>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center gap-2 text-xs text-white/40">
                        <span className={step === 'upload' ? 'text-cyan-400 font-medium' : uploadedDocs.length > 0 ? 'text-green-400' : ''}>
                            {t('steps.upload')}
                        </span>
                        <ArrowRight size={12} />
                        <span className={step === 'configure' ? 'text-cyan-400 font-medium' : ''}>
                            {t('steps.configure')}
                        </span>
                        <ArrowRight size={12} />
                        <span className={step === 'result' || step === 'generating' ? 'text-cyan-400 font-medium' : ''}>
                            {t('steps.quote')}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />
                        {step !== 'upload' && (
                            <button
                                onClick={handleReset}
                                className="text-sm text-white/40 hover:text-white/70 transition-colors"
                            >
                                {t('app.newQuote')}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Step 1: Upload */}
                {step === 'upload' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold mb-2">{t('upload.title')}</h2>
                            <p className="text-white/50">{t('upload.subtitle')}</p>
                        </div>

                        <UploadZone
                            clientId={DEMO_CLIENT_ID}
                            mode={mode}
                            onDocumentUploaded={handleDocumentUploaded}
                        />

                        {/* Email forwarding option */}
                        <div className="relative flex items-center gap-4 py-2">
                            <div className="flex-1 border-t border-white/10" />
                            <span className="text-xs text-white/30 uppercase tracking-wider">or</span>
                            <div className="flex-1 border-t border-white/10" />
                        </div>

                        <EmailIngestion
                            clientId={DEMO_CLIENT_ID}
                            onRatesReady={() => {
                                // When email ingestion completes, mark as having docs
                                handleDocumentUploaded({
                                    documentId: 'email-ingested',
                                    fileName: 'Email ingestion',
                                    fileType: 'email',
                                    textLength: 0,
                                    textPreview: '',
                                });
                            }}
                        />

                        {uploadedDocs.length > 0 && (
                            <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                <p className="text-sm text-white/50">
                                    <FileText size={14} className="inline mr-1" />
                                    {t('upload.docsProcessed', { count: uploadedDocs.length })}
                                </p>
                                <button
                                    onClick={() => setStep('configure')}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white font-medium rounded-lg transition-colors"
                                >
                                    {t('upload.configureQuote')} <ArrowRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Configure */}
                {step === 'configure' && (
                    <div className="max-w-xl mx-auto space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold mb-2">{t('configure.title')}</h2>
                            <p className="text-white/50">{t('configure.subtitle')}</p>
                        </div>

                        {error && (
                            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <AlertCircle size={18} className="text-red-400 mt-0.5" />
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Mode Selector */}
                            <div>
                                <label className="block text-sm text-white/60 mb-1.5">{t('configure.mode')}</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {MODE_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => {
                                                setMode(opt.value);
                                                // Auto-set container type for relevant modes
                                                if (opt.value === 'ground_ftl') setContainerType('ftl_truck');
                                                else if (opt.value === 'ground_ltl') setContainerType('ltl_pallet');
                                                else if (opt.value === 'ocean_fcl') setContainerType('40ft');
                                                else setContainerType('na');
                                            }}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors
                                                ${mode === opt.value
                                                    ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-400'
                                                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                                                }`}
                                        >
                                            {t(opt.labelKey as Parameters<typeof t>[0])}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-white/60 mb-1.5">{t('configure.origin')}</label>
                                    <input
                                        type="text"
                                        value={origin}
                                        onChange={(e) => setOrigin(e.target.value)}
                                        placeholder={t('configure.originPlaceholder')}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-cyan-400/40 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-white/60 mb-1.5">{t('configure.destination')}</label>
                                    <input
                                        type="text"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                        placeholder={t('configure.destinationPlaceholder')}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-cyan-400/40 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-white/60 mb-1.5">{t('configure.weight')}</label>
                                    <input
                                        type="number"
                                        value={weightKg}
                                        onChange={(e) => setWeightKg(e.target.value)}
                                        placeholder="500"
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-cyan-400/40 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-white/60 mb-1.5">{t('configure.urgency')}</label>
                                    <select
                                        value={urgency}
                                        onChange={(e) => setUrgency(e.target.value as 'high' | 'normal' | 'unknown')}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400/40 focus:outline-none"
                                    >
                                        <option value="unknown">{t('configure.urgencyLetAI')}</option>
                                        <option value="normal">{t('configure.urgencyNormal')}</option>
                                        <option value="high">{t('configure.urgencyHigh')}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Container Type (only for ocean/ground) */}
                            {showContainerSelector && (
                                <div>
                                    <label className="block text-sm text-white/60 mb-1.5">{t('configure.containerType')}</label>
                                    <select
                                        value={containerType}
                                        onChange={(e) => setContainerType(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400/40 focus:outline-none"
                                    >
                                        {CONTAINER_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm text-white/60 mb-1.5">
                                    {t('configure.cargoDescription')}{' '}
                                    <span className="text-white/30">{t('configure.cargoDescriptionOptional')}</span>
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={t('configure.cargoDescriptionPlaceholder')}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-cyan-400/40 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between pt-4 border-t border-white/10">
                            <button
                                onClick={() => setStep('upload')}
                                className="text-sm text-white/40 hover:text-white/70 transition-colors"
                            >
                                {t('configure.backToUpload')}
                            </button>
                            <button
                                onClick={handleGenerateQuote}
                                disabled={!origin || !destination || !weightKg}
                                className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Zap size={16} /> {t('configure.generate')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Generating */}
                {step === 'generating' && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 size={40} className="text-cyan-400 animate-spin mb-4" />
                        <h2 className="text-xl font-bold mb-2">{t('generating.title')}</h2>
                        <p className="text-white/50 text-sm">{t('generating.subtitle')}</p>
                    </div>
                )}

                {/* Step 4: Result */}
                {step === 'result' && quote && (
                    <QuoteTable
                        quote={quote}
                        onUrgencySelect={handleUrgencySelect}
                    />
                )}

                {step === 'result' && !quote && error && (
                    <div className="max-w-xl mx-auto text-center py-20">
                        <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">{t('quote.errorTitle')}</h2>
                        <p className="text-white/50 text-sm mb-4">{error}</p>
                        <button
                            onClick={() => setStep('configure')}
                            className="text-cyan-400 hover:text-cyan-300 text-sm"
                        >
                            {t('quote.backToConfigure')}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
