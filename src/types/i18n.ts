/**
 * TypeScript type definitions for internationalization (i18n)
 */

export type SupportedLanguage = 'en' | 'vi';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' }
];

/**
 * Common UI translations structure
 */
export interface CommonTranslations {
  nav: {
    home: string;
    readings: string;
    cards: string;
    about: string;
  };
  buttons: {
    shuffle: string;
    select: string;
    viewReading: string;
    newReading: string;
    share: string;
    export: string;
    startReading: string;
    backToHome: string;
  };
  labels: {
    question: string;
    questionPlaceholder: string;
    selectSpread: string;
    cardCount: string;
    progress: string;
    selectCards: string;
    yourReading: string;
    position: string;
    meaning: string;
    upright: string;
    reversed: string;
  };
  footer: {
    tagline: string;
    madeWith: string;
    privacy: string;
  };
}

/**
 * Spread-related translations
 */
export interface SpreadsTranslations {
  title: string;
  chooseSpread: string;
  popular: string;
  all: string;
}

/**
 * Card library translations
 */
export interface CardsTranslations {
  title: string;
  searchPlaceholder: string;
  majorArcana: string;
  minorArcana: string;
  suits: {
    wands: string;
    cups: string;
    swords: string;
    pentacles: string;
  };
  keywords: string;
  uprightMeaning: string;
  reversedMeaning: string;
}
