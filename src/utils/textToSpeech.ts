/**
 * Text-to-Speech Manager
 * Handles voice synthesis with Web Speech API for mystery voice narration
 */

import type { SupportedLanguage } from '../types/i18n';

export interface TTSOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onError?: (error: Error) => void;
}

export class TextToSpeechManager {
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded = false;
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      throw new Error('Speech Synthesis not supported in this browser');
    }

    this.synthesis = window.speechSynthesis;
    this.loadVoices();
  }

  /**
   * Load available voices (async in some browsers)
   */
  private loadVoices(): void {
    this.voices = this.synthesis.getVoices();

    if (this.voices.length === 0) {
      // Chrome loads voices asynchronously
      this.synthesis.addEventListener('voiceschanged', () => {
        this.voices = this.synthesis.getVoices();
        this.voicesLoaded = true;
      });
    } else {
      this.voicesLoaded = true;
    }
  }

  /**
   * Wait for voices to be loaded
   */
  private async waitForVoices(): Promise<void> {
    if (this.voicesLoaded && this.voices.length > 0) {
      return;
    }

    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait

      const checkVoices = () => {
        this.voices = this.synthesis.getVoices();

        if (this.voices.length > 0) {
          this.voicesLoaded = true;
          resolve();
        } else {
          attempts++;
          if (attempts >= maxAttempts) {
            reject(new Error('Voices failed to load after 5 seconds'));
          } else {
            setTimeout(checkVoices, 100);
          }
        }
      };

      // Also listen for voiceschanged event
      const onVoicesChanged = () => {
        this.voices = this.synthesis.getVoices();
        if (this.voices.length > 0) {
          this.voicesLoaded = true;
          this.synthesis.removeEventListener('voiceschanged', onVoicesChanged);
          resolve();
        }
      };

      this.synthesis.addEventListener('voiceschanged', onVoicesChanged);
      checkVoices();
    });
  }

  /**
   * Select an appropriate "mystery" voice based on language
   */
  private selectMysteryVoice(language: SupportedLanguage): SpeechSynthesisVoice | null {
    const languageCode = language === 'vi' ? 'vi' : 'en';

    console.log('Available voices:', this.voices.map(v => `${v.name} (${v.lang})`));

    // Filter voices by language
    let languageVoices = this.voices.filter(voice =>
      voice.lang.toLowerCase().startsWith(languageCode)
    );

    console.log(`Found ${languageVoices.length} voices for language: ${languageCode}`);

    // For Vietnamese: if no native voices, DON'T fallback
    // This allows us to properly detect missing Vietnamese support
    if (languageVoices.length === 0) {
      console.warn(`No ${language} voices available`);
      return null;
    }

    // Preferences for "mystery" voices (lower pitch, quality)
    const preferences = [
      // For English - prefer female, quality voices
      'Google UK English Female',
      'Google US English Female',
      'Microsoft Zira',
      'Karen',
      'Samantha',
      'Fiona',
      // For Vietnamese
      'Google tiếng Việt',
      'Microsoft An',
      'Vietnamese'
    ];

    // Try to find a preferred voice
    for (const pref of preferences) {
      const voice = languageVoices.find(v => v.name.includes(pref));
      if (voice) return voice;
    }

    // Prefer female voices for tarot (often perceived as more mystical)
    const femaleVoice = languageVoices.find(v =>
      v.name.toLowerCase().includes('female') ||
      v.name.includes('Zira') ||
      v.name.includes('Karen') ||
      v.name.includes('Samantha') ||
      v.name.includes('Fiona')
    );

    if (femaleVoice) return femaleVoice;

    // Default to first available voice for the language
    return languageVoices[0];
  }

  /**
   * Speak text with mystery voice settings
   * Uses Chrome keep-alive workaround to prevent interruption
   */
  async speak(
    text: string,
    language: SupportedLanguage,
    options?: TTSOptions
  ): Promise<void> {
    try {
      // Ensure voices are loaded
      await this.waitForVoices();

      // Cancel any ongoing speech
      this.stop();

      const voice = this.selectMysteryVoice(language);
      if (!voice) {
        const errorMsg = language === 'vi'
          ? 'Không tìm thấy giọng đọc phù hợp. Vui lòng thử lại sau.'
          : 'No suitable voice found. Please try again.';
        const error = new Error(errorMsg);
        options?.onError?.(error);
        throw error;
      }

      console.log('Selected voice:', voice.name, voice.lang);
      console.log('Text length:', text.length, 'characters');

      // Create single utterance with full text
      this.currentUtterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance.voice = voice;
      this.currentUtterance.lang = language === 'vi' ? 'vi-VN' : 'en-US';

      // Mystery voice settings
      this.currentUtterance.rate = 1.0; // Normal speed (Chrome handles this better)
      this.currentUtterance.pitch = 1.0; // Normal pitch
      this.currentUtterance.volume = 1.0; // Full volume

      // Event handlers
      this.currentUtterance.onstart = () => {
        console.log('TTS started');

        // CRITICAL: Chrome keep-alive workaround
        // Resume synthesis every 10 seconds to prevent timeout
        this.keepAliveInterval = setInterval(() => {
          if (this.synthesis.speaking && !this.synthesis.paused) {
            console.log('Keep-alive: pausing and resuming to prevent Chrome timeout');
            this.synthesis.pause();
            this.synthesis.resume();
          }
        }, 10000);

        options?.onStart?.();
      };

      this.currentUtterance.onend = () => {
        console.log('TTS ended normally');

        // Clear keep-alive interval
        if (this.keepAliveInterval) {
          clearInterval(this.keepAliveInterval);
          this.keepAliveInterval = null;
        }

        options?.onEnd?.();
        this.currentUtterance = null;
      };

      this.currentUtterance.onpause = () => {
        console.log('TTS paused');
        options?.onPause?.();
      };

      this.currentUtterance.onresume = () => {
        console.log('TTS resumed');
        options?.onResume?.();
      };

      this.currentUtterance.onerror = (event) => {
        console.error('TTS error:', event.error);

        // Clear keep-alive interval
        if (this.keepAliveInterval) {
          clearInterval(this.keepAliveInterval);
          this.keepAliveInterval = null;
        }

        options?.onError?.(new Error(`Speech synthesis error: ${event.error}`));
        this.currentUtterance = null;
      };

      console.log('Starting speech synthesis...');
      this.synthesis.speak(this.currentUtterance);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize voice');
      options?.onError?.(error);
      throw error;
    }
  }

  /**
   * Pause ongoing speech
   */
  pause(): void {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  /**
   * Stop and cancel ongoing speech
   */
  stop(): void {
    // Clear keep-alive interval
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    this.synthesis.cancel();
    this.currentUtterance = null;
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  /**
   * Check if paused
   */
  isPaused(): boolean {
    return this.synthesis.paused;
  }

  /**
   * Get available voices for a language
   */
  getAvailableVoices(language: SupportedLanguage): SpeechSynthesisVoice[] {
    const languageCode = language === 'vi' ? 'vi' : 'en';
    return this.voices.filter(voice => voice.lang.toLowerCase().startsWith(languageCode));
  }
}

/**
 * Check if Speech Synthesis is supported
 */
export function checkSpeechSynthesisSupport(): {
  supported: boolean;
  message: string;
} {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      message: 'Server-side rendering - Speech synthesis not available'
    };
  }

  if (!('speechSynthesis' in window)) {
    return {
      supported: false,
      message: 'Your browser does not support text-to-speech. Please try Chrome, Safari, or Edge.'
    };
  }

  return {
    supported: true,
    message: 'Speech synthesis supported'
  };
}

/**
 * Singleton instance (lazy initialization)
 */
let ttsManagerInstance: TextToSpeechManager | null = null;

export function getTTSManager(): TextToSpeechManager {
  if (!ttsManagerInstance) {
    ttsManagerInstance = new TextToSpeechManager();
  }
  return ttsManagerInstance;
}
