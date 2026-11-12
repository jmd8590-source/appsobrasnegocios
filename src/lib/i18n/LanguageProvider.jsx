'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getDictionary, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './dictionaries';

const LanguageContext = createContext(null);

function readByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => (vars[key] !== undefined ? String(vars[key]) : match));
}

export function LanguageProvider({ initialLang, children }) {
  const [lang, setLangState] = useState(
    SUPPORTED_LANGUAGES.includes(initialLang) ? initialLang : DEFAULT_LANGUAGE
  );

  const setLang = useCallback((next) => {
    if (!SUPPORTED_LANGUAGES.includes(next)) return;
    setLangState(next);
    try {
      document.cookie = `scraplens_lang=${next}; path=/; max-age=31536000; samesite=lax`;
      window.localStorage.setItem('scraplens_lang', next);
      document.documentElement.lang = next;
    } catch {
      // Storage unavailable (private mode, etc.) — in-memory state still works.
    }
  }, []);

  const dict = useMemo(() => getDictionary(lang), [lang]);

  const t = useCallback(
    (key, vars) => {
      const value = readByPath(dict, key);
      if (typeof value !== 'string') return key;
      return interpolate(value, vars);
    },
    [dict]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
