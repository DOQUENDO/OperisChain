/**
 * OperisChain — Language Switcher Component
 * 
 * Toggle between ES/EN with a clean pill-style switcher.
 */

'use client';

import { useTranslation } from '@/lib/i18n';

export function LanguageSwitcher() {
    const { locale, setLocale } = useTranslation();

    return (
        <div className="flex items-center bg-white/5 rounded-full border border-white/10 p-0.5 text-xs">
            <button
                onClick={() => setLocale('es')}
                className={`px-2.5 py-1 rounded-full transition-colors font-medium
                    ${locale === 'es'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-white/40 hover:text-white/60'
                    }`}
            >
                ES
            </button>
            <button
                onClick={() => setLocale('en')}
                className={`px-2.5 py-1 rounded-full transition-colors font-medium
                    ${locale === 'en'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-white/40 hover:text-white/60'
                    }`}
            >
                EN
            </button>
        </div>
    );
}
