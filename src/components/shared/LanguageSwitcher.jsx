'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/dictionaries';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ className }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t('lang.label')}
      className={cn('inline-flex items-center rounded-xl border border-edge bg-surface-2 p-1 text-xs font-semibold', className)}
    >
      {SUPPORTED_LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={cn(
            'px-2.5 py-1 rounded-lg uppercase tracking-wide transition-colors cursor-pointer',
            lang === code ? 'bg-accent text-accent-ink' : 'text-ink-muted hover:text-ink'
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
