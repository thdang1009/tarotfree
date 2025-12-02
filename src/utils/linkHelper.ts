/**
 * Helper to preserve language parameter in links
 */

import type { SupportedLanguage } from '../types/i18n';

/**
 * Add language parameter to a URL path
 */
export function withLang(path: string, lang: SupportedLanguage): string {
  const url = new URL(path, 'http://localhost'); // Base doesn't matter, we only need the path
  url.searchParams.set('lang', lang);
  return url.pathname + url.search;
}
