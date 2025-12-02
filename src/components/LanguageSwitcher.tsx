/**
 * Language Switcher Component
 * Allows users to switch between supported languages
 */

import { useState, useEffect } from 'react';
import { i18n } from '../utils/i18n';
import { LANGUAGES, type SupportedLanguage } from '../types/i18n';

export default function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(
    i18n.getCurrentLanguage()
  );
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    // Subscribe to language changes
    const unsubscribe = i18n.onChange((newLang) => {
      setCurrentLang(newLang);
    });

    return unsubscribe;
  }, []);

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    if (lang === currentLang || isChanging) return;

    setIsChanging(true);

    // Update language
    i18n.setLanguage(lang);

    // Reload page to apply new language across all components
    // This is the simplest approach for Astro pages
    setTimeout(() => {
      window.location.reload();
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
