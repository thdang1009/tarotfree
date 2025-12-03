/**
 * Internationalization (i18n) Manager
 * Handles language detection, switching, and translation loading
 */

import type { SupportedLanguage } from '../types/i18n';

export class I18nManager {
  private currentLanguage: SupportedLanguage;
  private translations: Map<string, any>;
  private listeners: Set<(lang: SupportedLanguage) => void>;

  constructor() {
    this.translations = new Map();
    this.listeners = new Set();
    this.currentLanguage = this.detectLanguage();

    // Re-detect language when page loads (handles navigation timing issues)
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const detectedLang = this.detectLanguage();
        if (detectedLang !== this.currentLanguage) {
          this.currentLanguage = detectedLang;
          this.listeners.forEach(listener => listener(detectedLang));
        }
      });
    }
  }

  /**
   * Detect user's preferred language
   * Priority: URL param > localStorage > Browser language > Default (en)
   */
  private detectLanguage(): SupportedLanguage {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return 'en';
    }

    // 1. Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang === 'en' || urlLang === 'vi') {
      // Save to localStorage for persistence
      localStorage.setItem('tarot-language', urlLang);
      return urlLang;
    }

    // 2. Check localStorage
    const storedLang = localStorage.getItem('tarot-language');
    if (storedLang === 'en' || storedLang === 'vi') {
      return storedLang;
    }

    // 3. Check browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('vi')) {
      return 'vi';
    }

    // 4. Default to English
    return 'en';
  }

  /**
   * Load translations for a specific namespace
   */
  async loadTranslations(namespace: string): Promise<void> {
    const lang = this.currentLanguage;
    const key = `${lang}-${namespace}`;

    if (!this.translations.has(key)) {
      try {
        // Dynamic import of translation files
        const translations = await import(`../i18n/${lang}/${namespace}.json`);
        this.translations.set(key, translations.default || translations);
      } catch (error) {
        console.error(`Failed to load translations for ${key}:`, error);
        // Fallback to English if Vietnamese fails
        if (lang === 'vi') {
          try {
            const fallback = await import(`../i18n/en/${namespace}.json`);
            this.translations.set(key, fallback.default || fallback);
          } catch (fallbackError) {
            console.error(`Failed to load fallback translations:`, fallbackError);
          }
        }
      }
    }
  }

  /**
   * Get translation by key
   * Supports nested keys with dot notation: "nav.home"
   * Supports parameter replacement: "progress" with {current: 1, total: 5}
   */
  t(namespace: string, key: string, params?: Record<string, any>): string {
    const translations = this.translations.get(`${this.currentLanguage}-${namespace}`);
    if (!translations) {
      console.warn(`Translations not loaded for: ${this.currentLanguage}-${namespace}`);
      return key;
    }

    let text = this.getNestedValue(translations, key);

    if (text === undefined || text === null) {
      console.warn(`Translation key not found: ${key} in ${this.currentLanguage}-${namespace}`);
      return key;
    }

    // Replace parameters: "Hello {name}" with params.name
    if (params && typeof text === 'string') {
      Object.keys(params).forEach(paramKey => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(params[paramKey]));
      });
    }

    return text;
  }

  /**
   * Get nested value from object using dot notation
   * Example: getNestedValue({nav: {home: "Home"}}, "nav.home") => "Home"
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  /**
   * Set current language
   */
  setLanguage(lang: SupportedLanguage): void {
    if (lang === this.currentLanguage) return;

    this.currentLanguage = lang;

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('tarot-language', lang);

      // Update URL parameter without reload
      const url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      window.history.replaceState({}, '', url.toString());
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(lang));

    // Clear cached translations to force reload
    this.translations.clear();
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Subscribe to language changes
   */
  onChange(callback: (lang: SupportedLanguage) => void): () => void {
    this.listeners.add(callback);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Check if translation is loaded
   */
  isLoaded(namespace: string): boolean {
    const key = `${this.currentLanguage}-${namespace}`;
    return this.translations.has(key);
  }
}

// Singleton instance
export const i18n = new I18nManager();

// Export convenience function for direct usage
export function t(namespace: string, key: string, params?: Record<string, any>): string {
  return i18n.t(namespace, key, params);
}
