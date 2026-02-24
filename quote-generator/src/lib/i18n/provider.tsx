/**
 * OperisChain — i18n Provider & Hook
 *
 * React context for language switching.
 * Uses localStorage to persist language preference.
 */

'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { t, type Locale, type TranslationKey } from './translations';

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'operis-locale';

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('es'); // Default to Spanish for LatAm

    // Load persisted locale on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'en' || stored === 'es') {
            setLocaleState(stored);
        }
    }, []);

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem(STORAGE_KEY, newLocale);
    }, []);

    const translate = useCallback(
        (key: TranslationKey, params?: Record<string, string | number>) => t(key, locale, params),
        [locale],
    );

    return (
        <I18nContext.Provider value={{ locale, setLocale, t: translate }}>
            {children}
        </I18nContext.Provider>
    );
}

/**
 * Hook to access translations and locale switching.
 *
 * Usage:
 * ```tsx
 * const { t, locale, setLocale } = useTranslation();
 * return <p>{t('upload.title')}</p>;
 * ```
 */
export function useTranslation() {
    const ctx = useContext(I18nContext);
    if (!ctx) {
        throw new Error('useTranslation must be used within I18nProvider');
    }
    return ctx;
}
