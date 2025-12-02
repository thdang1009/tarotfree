/**
 * Server-side i18n utilities for Astro pages
 * This runs during SSR/build time, not in the browser
 */

import type { SupportedLanguage } from '../types/i18n';

// Import translation files directly
import enCommon from '../i18n/en/common.json';
import viCommon from '../i18n/vi/common.json';
import enSpreads from '../i18n/en/spreads.json';
import viSpreads from '../i18n/vi/spreads.json';
import enCards from '../i18n/en/cards.json';
import viCards from '../i18n/vi/cards.json';

const translations: Record<SupportedLanguage, Record<string, any>> = {
  en: {
    common: enCommon,
    spreads: enSpreads,
    cards: enCards
  },
  vi: {
    common: viCommon,
    spreads: viSpreads,
    cards: viCards
  }
};

/**
 * Detect language from Astro request
 */
export function detectLanguage(request?: Request): SupportedLanguage {
  if (!request) return 'en';

  try {
    const url = new URL(request.url);

    // Check URL parameter
    const langParam = url.searchParams.get('lang');
    if (langParam === 'en' || langParam === 'vi') {
      return langParam;
    }

    // Check cookies (if set by client-side)
    const cookies = request.headers.get('cookie');
    if (cookies) {
      const langCookie = cookies.split(';').find(c => c.trim().startsWith('tarot-language='));
      if (langCookie) {
        const lang = langCookie.split('=')[1];
        if (lang === 'en' || lang === 'vi') {
          return lang;
        }
      }
    }

    // Check Accept-Language header
    const acceptLang = request.headers.get('accept-language');
    if (acceptLang && acceptLang.toLowerCase().includes('vi')) {
      return 'vi';
    }
  } catch (error) {
    console.error('Error detecting language:', error);
  }

  return 'en'; // Default
}

/**
 * Get translation by key
 */
export function t(
  lang: SupportedLanguage,
  namespace: string,
  key: string,
  params?: Record<string, any>
): string {
  const langTranslations = translations[lang];
  if (!langTranslations) return key;

  const nsTranslations = langTranslations[namespace];
  if (!nsTranslations) return key;

  let text = getNestedValue(nsTranslations, key);

  if (text === undefined || text === null) {
    return key;
  }

  // Replace parameters
  if (params && typeof text === 'string') {
    Object.keys(params).forEach(paramKey => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(params[paramKey]));
    });
  }

  return text;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

/**
 * Create a translator function for a specific language and namespace
 */
export function createTranslator(lang: SupportedLanguage, namespace: string) {
  return (key: string, params?: Record<string, any>) => t(lang, namespace, key, params);
}
