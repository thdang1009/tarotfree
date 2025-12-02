/**
 * Utility functions to load language-specific data
 */

import type { SupportedLanguage } from '../types/i18n';
import type { TarotSpread } from '../types/tarot';

// Import spread data
import enSpreads from '../i18n/en/spreads.json';
import viSpreads from '../i18n/vi/spreads.json';

// Import card data
import enCards from '../i18n/en/cards.json';
import viCards from '../i18n/vi/cards.json';

/**
 * Load spreads for a specific language
 */
export function loadSpreads(lang: SupportedLanguage): TarotSpread[] {
  return lang === 'vi' ? viSpreads as TarotSpread[] : enSpreads as TarotSpread[];
}

/**
 * Load cards for a specific language
 */
export function loadCards(lang: SupportedLanguage): any[] {
  return lang === 'vi' ? viCards : enCards;
}
