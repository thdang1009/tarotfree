/**
 * React hook for using i18n in components
 */

import { useState, useEffect } from 'react';
import { i18n } from '../utils/i18n';
import type { SupportedLanguage } from '../types/i18n';

export function useI18n(namespace: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(
    i18n.getCurrentLanguage()
  );

  useEffect(() => {
    // Load translations for this namespace
    i18n.loadTranslations(namespace).then(() => {
      setIsLoaded(true);
    });

    // Subscribe to language changes
    const unsubscribe = i18n.onChange((newLang) => {
      setCurrentLang(newLang);
      // Reload translations when language changes
      i18n.loadTranslations(namespace).then(() => {
        setIsLoaded(true);
      });
    });

    return unsubscribe;
  }, [namespace]);

  const t = (key: string, params?: Record<string, any>): string => {
    if (!isLoaded) return key;
    return i18n.t(namespace, key, params);
  };

  return {
    t,
    isLoaded,
    currentLang
  };
}
