/**
 * Mystery Voice Button Component
 * Beautiful button to trigger text-to-speech narration of the full reading
 */

import { useState, useEffect } from 'react';
import type { FullReadingAnalysis } from '../types/reading';
import { getTTSManager, checkSpeechSynthesisSupport } from '../utils/textToSpeech';
import { i18n } from '../utils/i18n';

interface MysteryVoiceButtonProps {
  analysis: FullReadingAnalysis;
  className?: string;
}

export default function MysteryVoiceButton({
  analysis,
  className = ''
}: MysteryVoiceButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [hasVoice, setHasVoice] = useState(true);
  const language = i18n.getCurrentLanguage();

  useEffect(() => {
    // Check browser support
    const { supported, message } = checkSpeechSynthesisSupport();
    if (!supported) {
      setIsSupported(false);
      setError(message);
      setHasVoice(false);
      return;
    }

    // Check for available voices for current language
    const checkVoicesForLanguage = () => {
      try {
        const tts = getTTSManager();
        const langVoices = tts.getAvailableVoices(language);

        console.log(`[MysteryVoice] Found ${langVoices.length} voices for ${language}`);

        if (langVoices.length === 0) {
          console.warn(`[MysteryVoice] No voices available for ${language}, hiding button`);
          setHasVoice(false);
        } else {
          setHasVoice(true);
        }
      } catch (err) {
        console.error('[MysteryVoice] Error checking voices:', err);
        // TTS not initialized yet, assume voices available
      }
    };

    // Check immediately
    checkVoicesForLanguage();

    // Also check after a delay (voices might load asynchronously)
    const timer = setTimeout(checkVoicesForLanguage, 1000);

    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      try {
        const tts = getTTSManager();
        tts.stop();
      } catch (err) {
        // TTS not initialized
      }
    };
  }, [language]);

  /**
   * Generate full text to be spoken
   */
  const generateFullText = (): string => {
    const { opening, body, conclusion, advice } = analysis.synthesis;

    // Combine all sections with dramatic pauses
    const sections = [
      opening,
      ...body,
      conclusion,
      advice
    ];

    // Add pauses between sections for dramatic effect
    // Three dots create a natural pause in speech synthesis
    return sections.join('... ');
  };

  /**
   * Handle toggle play/pause/stop
   */
  const handleToggle = async () => {
    if (!isSupported) return;

    try {
      const tts = getTTSManager();

      // If playing, stop (not pause - simpler UX)
      if (isPlaying) {
        tts.stop();
        setIsPlaying(false);
        setIsPaused(false);
        return;
      }

      // If paused, resume
      if (isPaused) {
        tts.resume();
        setIsPaused(false);
        setIsPlaying(true);
        return;
      }

      // Start new speech
      const fullText = generateFullText();

      // Set up polling to check if speech is still actually playing
      // This handles browser bugs where TTS stops without firing onend
      let pollInterval: NodeJS.Timeout;

      await tts.speak(fullText, language, {
        onStart: () => {
          console.log('[MysteryVoice] Speech started');
          setIsPlaying(true);
          setIsPaused(false);
          setError(null);

          // Poll every 1s to verify speech is still running
          // This catches browser bugs where TTS stops without events
          pollInterval = setInterval(() => {
            const speaking = tts.isSpeaking();
            const paused = tts.isPaused();
            console.log('[MysteryVoice] Poll check - speaking:', speaking, 'paused:', paused);

            if (!speaking && !paused) {
              // Speech stopped without firing onend - reset state
              console.warn('[MysteryVoice] Speech stopped unexpectedly, resetting state');
              setIsPlaying(false);
              setIsPaused(false);
              clearInterval(pollInterval);
            }
          }, 1000);
        },
        onEnd: () => {
          console.log('[MysteryVoice] Speech ended');
          setIsPlaying(false);
          setIsPaused(false);
          if (pollInterval) clearInterval(pollInterval);
        },
        onPause: () => {
          console.log('[MysteryVoice] Speech paused');
          setIsPaused(true);
          setIsPlaying(false);
        },
        onResume: () => {
          console.log('[MysteryVoice] Speech resumed');
          setIsPaused(false);
          setIsPlaying(true);
        },
        onError: (err) => {
          console.error('[MysteryVoice] Speech error:', err.message);
          setError(err.message);
          setIsPlaying(false);
          setIsPaused(false);
          if (pollInterval) clearInterval(pollInterval);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize speech');
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  // Get localized text
  const getText = () => {
    if (language === 'vi') {
      return {
        play: 'Nghe Giọng Bí Ẩn',
        pause: 'Tạm Dừng',
        resume: 'Tiếp Tục',
        stop: 'Dừng',
        subtitle: 'Nhấp để nghe bài xem của bạn được kể bởi giọng nói huyền bí. Tốt nhất với tai nghe. 🎧',
        errorPrefix: 'Lỗi'
      };
    }
    return {
      play: 'Hear the Mystery Voice',
      pause: 'Pause Mystery Voice',
      resume: 'Continue',
      stop: 'Stop',
      subtitle: 'Click to hear your reading narrated by the mystical voice. Works best with headphones. 🎧',
      errorPrefix: 'Error'
    };
  };

  const text = getText();

  // Don't render anything if TTS not supported or no voice available
  if (!isSupported || !hasVoice) {
    console.log(`[MysteryVoice] Not rendering: supported=${isSupported}, hasVoice=${hasVoice}`);
    return null;
  }

  return (
    <>
      {/* Floating Sticky Button - Bottom Right */}
      <div className={`fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 ${className}`}>
        {/* Main Mystery Button - Single Play/Stop Toggle */}
        <button
          onClick={handleToggle}
          disabled={!!error}
          title={isPlaying ? text.stop : isPaused ? text.resume : text.play}
          className={`
            relative group
            w-16 h-16 rounded-full
            bg-gradient-to-r from-violet-deep via-purple-800 to-violet-deep
            text-white
            shadow-2xl hover:shadow-purple-500/50
            transform hover:scale-110 active:scale-95
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
            overflow-hidden
            flex items-center justify-center
          `}
        >
          {/* Animated background shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>

          {/* Icon Only */}
          <div className="relative">
            {isPlaying ? (
              <span className="text-3xl">⏹</span>
            ) : (
              <span className="text-3xl">🎙️</span>
            )}
          </div>

          {/* Tooltip on Hover */}
          <div className="absolute right-full mr-3 px-3 py-2 bg-violet-deep text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {isPlaying ? text.stop : isPaused ? text.resume : text.play}
          </div>
        </button>

        {/* Error Display - Compact */}
        {error && (
          <div className="px-3 py-2 bg-red-100 text-red-800 rounded-lg text-xs max-w-xs shadow-lg">
            {error}
          </div>
        )}
      </div>

      {/* Optional: Hint at bottom of page (non-sticky) */}
      {!isPlaying && !error && (
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600 italic">
            💡 {text.subtitle}
          </p>
        </div>
      )}
    </>
  );
}
