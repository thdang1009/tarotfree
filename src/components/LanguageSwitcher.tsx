/**
 * Language Switcher Component
 * Allows users to switch between supported languages
 */

import { useState, useEffect } from 'react';
import { i18n } from '../utils/i18n';
import { LANGUAGES, type SupportedLanguage } from '../types/i18n';

export default function LanguageSwitcher() {
  // Initialize state with a function to ensure fresh read on every mount
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() =>
    i18n.getCurrentLanguage()
  );
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    // Double-check language on mount (handles async hydration timing)
    const detectedLang = i18n.getCurrentLanguage();
    if (detectedLang !== currentLang) {
      setCurrentLang(detectedLang);
    }

    // Subscribe to language changes
    const unsubscribe = i18n.onChange((newLang) => {
      setCurrentLang(newLang);
    });

    return unsubscribe;
  }, [currentLang]);

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    if (lang === currentLang || isChanging) return;

    setIsChanging(true);

    // Set cookie for server-side detection (expires in 1 year)
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `tarot-language=${lang}; path=/; expires=${expires.toUTCString()}`;

    // Update language in localStorage for client-side
    i18n.setLanguage(lang);

    // Add lang parameter to current URL
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);

    // Navigate to URL with language parameter
    setTimeout(() => {
      window.location.href = url.toString();
    }, 300); // Small delay for visual feedback
  };

  return (
    <div className="flex gap-2 items-center">
      {LANGUAGES.map(lang => {
        const isActive = currentLang === lang.code;

        return (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={isChanging}
            className={`
              px-3 py-1.5 rounded-lg
              font-medium text-sm
              transition-all duration-200
              flex items-center gap-1.5
              ${isActive
                ? 'bg-violet-deep text-white shadow-md'
                : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-sm'
              }
              ${isChanging ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
              disabled:cursor-not-allowed
            `}
            aria-label={`Switch to ${lang.name}`}
            aria-current={isActive ? 'true' : 'false'}
          >
            <span className="text-base" aria-hidden="true">{lang.flag}</span>
            <span className="hidden sm:inline">{lang.nativeName}</span>
            <span className="sm:hidden">{lang.code.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}
