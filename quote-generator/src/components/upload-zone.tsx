/**
 * OperisChain — Upload Zone Component
 * 
 * Drag & drop zone for carrier rate documents.
 * Supports PDF, Excel, CSV, and pasted email text.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface UploadZoneProps {
    clientId: string;
    mode?: string;
    onDocumentUploaded: (result: UploadResult) => void;
    disabled?: boolean;
}

export interface UploadResult {
    documentId: string;
    fileName: string;
    fileType: string;
    textLength: number;
    textPreview: string;
}

type UploadStatus = 'idle' | 'uploading' | 'extracting' | 'success' | 'error';

interface UploadedFile {
    id: string;
    name: string;
    status: UploadStatus;
    documentId?: string;
    ratesExtracted?: number;
    error?: string;
    warnings?: string[];
}

export function UploadZone({ clientId, mode, onDocumentUploaded, disabled }: UploadZoneProps) {
    const { t } = useTranslation();
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [showPasteArea, setShowPasteArea] = useState(false);
    const [pasteText, setPasteText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const processFile = async (file: File) => {
        const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const uploadEntry: UploadedFile = {
            id: uploadId,
            name: file.name,
            status: 'uploading',
        };

        setFiles(prev => [...prev, uploadEntry]);

        try {
            // Step 1: Ingest
            const formData = new FormData();
            formData.append('file', file);
            formData.append('clientId', clientId);

            const ingestRes = await fetch('/api/ingest', { method: 'POST', body: formData });
            const ingestData = await ingestRes.json();

            if (!ingestRes.ok) throw new Error(ingestData.error || 'Ingestion failed');

            setFiles(prev => prev.map(f =>
                f.id === uploadId ? { ...f, status: 'extracting', documentId: ingestData.documentId } : f
            ));

            // Step 2: Extract rates
            const extractRes = await fetch('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: ingestData.documentId, clientId, mode }),
            });
            const extractData = await extractRes.json();

            if (!extractRes.ok) throw new Error(extractData.error || 'Extraction failed');

            setFiles(prev => prev.map(f =>
                f.id === uploadId
                    ? {
                        ...f,
                        status: 'success',
                        ratesExtracted: extractData.ratesExtracted,
                        warnings: extractData.warnings,
                    }
                    : f
            ));

            onDocumentUploaded(ingestData);

        } catch (error) {
            setFiles(prev => prev.map(f =>
                f.id === uploadId ? { ...f, status: 'error', error: String(error) } : f
            ));
        }
    };

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;

        const droppedFiles = Array.from(e.dataTransfer.files);
        for (const file of droppedFiles) {
            await processFile(file);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [disabled]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || disabled) return;
        const selectedFiles = Array.from(e.target.files);
        for (const file of selectedFiles) {
            await processFile(file);
        }
    };

    const handlePasteSubmit = async () => {
        if (!pasteText.trim() || disabled) return;

        const uploadId = `${Date.now()}-paste`;
        const uploadEntry: UploadedFile = {
            id: uploadId,
            name: 'Pasted Email Text',
            status: 'uploading',
        };

        setFiles(prev => [...prev, uploadEntry]);

        try {
            const formData = new FormData();
            formData.append('text', pasteText);
            formData.append('clientId', clientId);

            const ingestRes = await fetch('/api/ingest', { method: 'POST', body: formData });
            const ingestData = await ingestRes.json();

            if (!ingestRes.ok) throw new Error(ingestData.error || 'Ingestion failed');

            setFiles(prev => prev.map(f =>
                f.id === uploadId ? { ...f, status: 'extracting', documentId: ingestData.documentId } : f
            ));

            const extractRes = await fetch('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: ingestData.documentId, clientId, mode }),
            });
            const extractData = await extractRes.json();

            if (!extractRes.ok) throw new Error(extractData.error || 'Extraction failed');

            setFiles(prev => prev.map(f =>
                f.id === uploadId
                    ? { ...f, status: 'success', ratesExtracted: extractData.ratesExtracted, warnings: extractData.warnings }
                    : f
            ));

            onDocumentUploaded(ingestData);
            setPasteText('');
            setShowPasteArea(false);

        } catch (error) {
            setFiles(prev => prev.map(f =>
                f.id === uploadId ? { ...f, status: 'error', error: String(error) } : f
            ));
        }
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
                        ? 'border-cyan-400 bg-cyan-400/5 scale-[1.02]'
                        : 'border-white/10 hover:border-cyan-400/40 hover:bg-white/[0.02]'
                    }
          ${disabled ? 'opacity-50 pointer-events-none' : ''}
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.xlsx,.xls,.csv,.eml,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <Upload className={`mx-auto mb-3 ${isDragging ? 'text-cyan-400' : 'text-white/40'}`} size={36} />

                <p className="text-white/80 font-medium mb-1">
                    {t('upload.dropzone')}
                </p>
                <p className="text-sm text-white/40">
                    {t('upload.formats')}
                </p>
            </div>

            {/* Paste Email Option */}
            <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-white/10" />
                <button
                    onClick={() => setShowPasteArea(!showPasteArea)}
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                    {showPasteArea ? t('upload.pasteHide') : t('upload.pasteToggle')}
                </button>
                <div className="flex-1 h-px bg-white/10" />
            </div>

            {showPasteArea && (
                <div className="space-y-2">
                    <textarea
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        placeholder={t('upload.pastePlaceholder')}
                        className="w-full h-40 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white/80 placeholder-white/30 resize-none focus:border-cyan-400/40 focus:outline-none"
                    />
                    <button
                        onClick={handlePasteSubmit}
                        disabled={!pasteText.trim() || disabled}
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('upload.pasteSubmit')}
                    </button>
                </div>
            )}

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map(file => (
                        <div
                            key={file.id}
                            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                        >
                            <FileText size={18} className="text-white/40 shrink-0" />

                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white/80 truncate">{file.name}</p>
                                {file.status === 'uploading' && (
                                    <p className="text-xs text-yellow-400 flex items-center gap-1">
                                        <Loader2 size={12} className="animate-spin" /> {t('upload.uploading')}
                                    </p>
                                )}
                                {file.status === 'extracting' && (
                                    <p className="text-xs text-cyan-400 flex items-center gap-1">
                                        <Loader2 size={12} className="animate-spin" /> {t('upload.extracting')}
                                    </p>
                                )}
                                {file.status === 'success' && (
                                    <p className="text-xs text-green-400 flex items-center gap-1">
                                        <CheckCircle2 size={12} /> {t('upload.success', { count: file.ratesExtracted || 0 })}
                                        {file.warnings && file.warnings.length > 0 && ` · ${t('upload.warnings', { count: file.warnings.length })}`}
                                    </p>
                                )}
                                {file.status === 'error' && (
                                    <p className="text-xs text-red-400 flex items-center gap-1">
                                        <AlertCircle size={12} /> {file.error}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={() => removeFile(file.id)}
                                className="text-white/30 hover:text-white/60 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
