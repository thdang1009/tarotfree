/**
 * Full Reading Display Component
 * Synthesised reading with improved visual hierarchy and structure.
 */

import { useState, useEffect } from 'react';
import type { FullReadingAnalysis } from '../types/reading';
import type { DrawnCard, TarotSpread } from '../types/tarot';
import { analyzeReading } from '../utils/readingAnalyzer';
import MysteryVoiceButton from './MysteryVoiceButton';
import { i18n } from '../utils/i18n';

interface FullReadingDisplayProps {
  cards: DrawnCard[];
  spread: TarotSpread;
  question?: string;
}

// ── Energy badge config ───────────────────────────────────────────────────────
const ENERGY_CONFIG = {
  positive: { label: 'Positive Energy',     labelVi: 'Năng Lượng Tích Cực',   icon: '🌟', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  negative: { label: 'Challenging Energy',  labelVi: 'Năng Lượng Thách Thức', icon: '🌑', bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-300'   },
  mixed:    { label: 'Mixed Energy',         labelVi: 'Năng Lượng Hỗn Hợp',   icon: '⚖️', bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-300'    },
  neutral:  { label: 'Neutral Energy',       labelVi: 'Năng Lượng Trung Tính', icon: '🌙', bg: 'bg-gray-100',    text: 'text-gray-700',    border: 'border-gray-300'    },
} as const;

const INTERACTION_CONFIG = {
  supporting:    { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-l-emerald-400', label: 'Supporting',    labelVi: 'Hỗ Trợ'     },
  challenging:   { bg: 'bg-red-100',     text: 'text-red-800',     border: 'border-l-red-400',     label: 'Challenging',   labelVi: 'Thách Thức' },
  complementary: { bg: 'bg-sky-100',     text: 'text-sky-800',     border: 'border-l-sky-400',     label: 'Complementary', labelVi: 'Bổ Sung'    },
  contradicting: { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-l-amber-400',   label: 'Contradicting', labelVi: 'Mâu Thuẫn'  },
  neutral:       { bg: 'bg-gray-100',    text: 'text-gray-700',    border: 'border-l-gray-300',    label: 'Neutral',       labelVi: 'Trung Lập'  },
} as const;

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-5 p-8 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl shadow-2xl animate-pulse">
      <div className="h-10 bg-violet-200/50 rounded-lg w-2/3 mx-auto" />
      <div className="h-5 bg-violet-100/50 rounded w-1/2 mx-auto" />
      <div className="grid grid-cols-3 gap-3 mt-6">
        {[1,2,3].map(i => <div key={i} className="h-16 bg-violet-100/50 rounded-xl" />)}
      </div>
      <div className="space-y-3 mt-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-4 bg-violet-100/40 rounded" style={{ width: `${100 - i * 8}%` }} />
        ))}
      </div>
    </div>
  );
}

// ── Card thumbnail ────────────────────────────────────────────────────────────
function CardThumb({ dc }: { dc: DrawnCard }) {
  return (
    <div className={`w-8 h-12 rounded overflow-hidden shadow flex-shrink-0 ${dc.reversed ? 'rotate-180' : ''}`}>
      <img src={dc.card.image} alt={dc.card.name} className="w-full h-full object-cover" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FullReadingDisplay({
  cards,
  spread,
  question = ''
}: FullReadingDisplayProps) {
  const [analysis, setAnalysis] = useState<FullReadingAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [interactionsOpen, setInteractionsOpen] = useState(false);

  const lang = i18n.getCurrentLanguage();
  const isVi = lang === 'vi';

  useEffect(() => {
    const timer = setTimeout(() => {
      const result = analyzeReading(cards, spread, question);
      setAnalysis(result);
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [cards, spread, question]);

  if (isLoading) return <LoadingSkeleton />;
  if (!analysis) return null;

  const energy = ENERGY_CONFIG[analysis.theme.overallEnergy];

  const suitIcon: Record<string, string> = {
    wands: '🔥', cups: '💧', swords: '⚔️', pentacles: '🪙'
  };
  const suitNameVi: Record<string, string> = {
    wands: 'Bộ Gậy', cups: 'Bộ Chén', swords: 'Bộ Kiếm', pentacles: 'Bộ Xu'
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 rounded-2xl shadow-2xl border border-violet-200/60 overflow-hidden">

        {/* ── Header bar ── */}
        <div className="bg-gradient-to-r from-violet-deep to-violet-medium px-6 py-6 text-white text-center">
          <h2 className="text-3xl md:text-4xl font-heading mb-1">
            ✨ {isVi ? 'Tổng Hợp Bài Xem' : 'Full Reading Synthesis'}
          </h2>
          <p className="text-violet-200 text-sm md:text-base font-medium">
            {analysis.theme.primaryTheme}
          </p>
        </div>

        <div className="p-5 md:p-8 space-y-7">

          {/* ── Question box ── */}
          {question.trim() && (
            <div className="bg-white border-2 border-violet-deep/20 rounded-xl px-5 py-4 shadow-sm">
              <p className="text-xs font-bold text-violet-medium uppercase tracking-widest mb-2">
                🔮 {isVi ? 'Câu Hỏi Của Bạn' : 'Your Question'}
              </p>
              <p className="text-base md:text-lg text-gray-800 italic leading-relaxed">
                "{question.trim()}"
              </p>
            </div>
          )}

          {/* ── At-a-glance stats row ── */}
          <div className="grid grid-cols-3 gap-3">
            {/* Energy */}
            <div className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border text-center ${energy.bg} ${energy.border}`}>
              <span className="text-2xl">{energy.icon}</span>
              <span className={`text-[11px] font-bold leading-tight ${energy.text}`}>
                {isVi ? energy.labelVi : energy.label}
              </span>
            </div>

            {/* Dominant suit */}
            {analysis.theme.dominantSuit ? (
              <div className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl border bg-violet-50 border-violet-200 text-center">
                <span className="text-2xl">{suitIcon[analysis.theme.dominantSuit] ?? '🃏'}</span>
                <span className="text-[11px] font-bold text-violet-deep leading-tight capitalize">
                  {isVi ? suitNameVi[analysis.theme.dominantSuit] : analysis.theme.dominantSuit}
                </span>
                <span className="text-[9px] text-gray-400">{isVi ? 'Bộ Chủ Đạo' : 'Dominant'}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl border bg-violet-50 border-violet-200 text-center">
                <span className="text-2xl">⚖️</span>
                <span className="text-[11px] font-bold text-violet-deep leading-tight">{isVi ? 'Cân Bằng' : 'Balanced'}</span>
                <span className="text-[9px] text-gray-400">{isVi ? 'Các Bộ Bài' : 'Suits'}</span>
              </div>
            )}

            {/* Major arcana count */}
            <div className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl border bg-gold-soft/10 border-gold-soft/40 text-center">
              <span className="text-2xl font-bold text-gold-soft leading-none">{analysis.theme.majorArcanaCount}</span>
              <span className="text-[11px] font-bold text-violet-deep leading-tight">
                {isVi ? 'Bài Lớn' : 'Major Arcana'}
              </span>
              <span className="text-[9px] text-gray-400">
                {isVi ? `/ ${cards.length} lá` : `of ${cards.length} cards`}
              </span>
            </div>
          </div>

          {/* ── Secondary theme tags ── */}
          {analysis.theme.secondaryThemes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {analysis.theme.secondaryThemes.map(theme => (
                <span
                  key={theme}
                  className="px-3 py-1 bg-violet-deep/10 text-violet-deep rounded-full text-xs font-semibold border border-violet-deep/20"
                >
                  {theme}
                </span>
              ))}
            </div>
          )}

          {/* ── Divider ── */}
          <div className="border-t border-violet-200/60" />

          {/* ── Opening (most prominent) ── */}
          <section>
            <p className="text-lg md:text-xl leading-relaxed text-gray-800 italic font-medium">
              {analysis.synthesis.opening}
            </p>
          </section>

          {/* ── Your Story ── */}
          {analysis.synthesis.body.length > 0 && (
            <section>
              <h3 className="text-xl font-heading text-violet-deep mb-4 flex items-center gap-2">
                <span>📖</span>
                <span>{isVi ? 'Câu Chuyện Của Bạn' : 'Your Story'}</span>
              </h3>
              <div className="space-y-4">
                {analysis.synthesis.body.map((paragraph, index) => (
                  <p key={index} className="text-base leading-relaxed text-gray-700">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* ── With You / Watch For (2-col with thumbnails) ── */}
          {(analysis.supportingCards.length > 0 || analysis.challengingCards.length > 0) && (
            <section className="grid md:grid-cols-2 gap-4">
              {analysis.supportingCards.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-emerald-800 mb-3 uppercase tracking-widest flex items-center gap-1">
                    ✅ {isVi ? 'Đang Đồng Hành' : 'With You'}
                  </h4>
                  <ul className="space-y-2.5">
                    {analysis.supportingCards.map(dc => (
                      <li key={dc.position} className="flex items-center gap-3">
                        <CardThumb dc={dc} />
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-gray-800 block truncate">{dc.card.name}</span>
                          {dc.reversed && (
                            <span className="text-[10px] text-gray-400">{isVi ? 'Ngược' : 'Reversed'}</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.challengingCards.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-amber-800 mb-3 uppercase tracking-widest flex items-center gap-1">
                    🌊 {isVi ? 'Cần Chú Ý' : 'Watch For'}
                  </h4>
                  <ul className="space-y-2.5">
                    {analysis.challengingCards.map(dc => (
                      <li key={dc.position} className="flex items-center gap-3">
                        <CardThumb dc={dc} />
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-gray-800 block truncate">{dc.card.name}</span>
                          {dc.reversed && (
                            <span className="text-[10px] text-gray-400">{isVi ? 'Ngược' : 'Reversed'}</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* ── Card Conversations (collapsible) ── */}
          {analysis.interactions.length > 0 && (
            <section className="bg-violet-deep/5 border border-violet-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setInteractionsOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-violet-deep/8 transition-colors"
              >
                <span className="font-heading text-lg text-violet-deep flex items-center gap-2">
                  <span>🌟</span>
                  <span>{isVi ? 'Đối Thoại Giữa Các Lá Bài' : 'Card Conversations'}</span>
                  <span className="text-xs font-normal text-violet-medium bg-violet-deep/10 px-2 py-0.5 rounded-full ml-1">
                    {analysis.interactions.length}
                  </span>
                </span>
                <span className={`text-violet-medium text-lg transition-transform duration-200 ${interactionsOpen ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>

              {interactionsOpen && (
                <div className="px-5 pb-5 space-y-3 border-t border-violet-200/60 pt-4">
                  {analysis.interactions.slice(0, 4).map((interaction, index) => {
                    const cfg = INTERACTION_CONFIG[interaction.relationshipType];
                    return (
                      <div key={index} className={`rounded-lg p-4 border-l-4 bg-white/80 ${cfg.border}`}>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${cfg.bg} ${cfg.text}`}>
                            {isVi ? cfg.labelVi : cfg.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            <span className="font-semibold text-gray-700">{interaction.card1.name}</span>
                            <span className="mx-1 text-gray-400">↔</span>
                            <span className="font-semibold text-gray-700">{interaction.card2.name}</span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{interaction.interpretation}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ── The Path Forward (outcome influencers) ── */}
          {analysis.outcomeInfluencers.length > 0 && (
            <section>
              <h3 className="text-xl font-heading text-violet-deep mb-4 flex items-center gap-2">
                <span>🎯</span>
                <span>{isVi ? 'Con Đường Phía Trước' : 'The Path Forward'}</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {analysis.outcomeInfluencers.map(dc => (
                  <div
                    key={dc.position}
                    className="flex items-center gap-3 bg-white border border-violet-200 rounded-xl px-4 py-2.5 shadow-sm"
                  >
                    <div className={`w-10 h-[60px] rounded overflow-hidden shadow flex-shrink-0 ${dc.reversed ? 'rotate-180' : ''}`}>
                      <img src={dc.card.image} alt={dc.card.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-violet-deep leading-none mb-0.5">{dc.card.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {dc.reversed
                          ? (isVi ? 'Ngược' : 'Reversed')
                          : (isVi ? 'Ngửa' : 'Upright')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Ornamental divider ── */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 border-t border-violet-300/40" />
            <span className="text-violet-300 text-base select-none">✦</span>
            <div className="flex-1 border-t border-violet-300/40" />
          </div>

          {/* ── Closing Message ── */}
          <section className="bg-gradient-to-br from-violet-deep to-violet-medium text-white rounded-xl p-6 md:p-8">
            <h3 className="text-2xl font-heading mb-3 flex items-center gap-2">
              <span>🌙</span>
              <span>{isVi ? 'Thông Điệp Khép Lại' : 'Closing Message'}</span>
            </h3>
            <p className="text-base md:text-lg leading-relaxed mb-6 text-violet-100">
              {analysis.synthesis.conclusion}
            </p>

            <div className="border-t border-white/20 pt-5">
              <h4 className="text-lg font-heading mb-2 flex items-center gap-2">
                <span>💫</span>
                <span>{isVi ? 'Lời Khuyên' : 'Guidance'}</span>
              </h4>
              <p className="text-base leading-relaxed text-violet-100">
                {analysis.synthesis.advice}
              </p>
            </div>
          </section>

          {/* ── Disclaimer + TTS hint ── */}
          <div className="text-center space-y-1 pt-1 border-t border-violet-200/60">
            <p className="text-xs text-gray-400 italic">
              {isVi
                ? 'Bài xem dựa trên giải nghĩa tarot truyền thống. Hãy tin vào trực giác của bạn.'
                : 'Based on traditional tarot interpretations. Trust your intuition as the final guide.'}
            </p>
            <p className="text-xs text-gray-400">
              {isVi
                ? '🎙️ Muốn nghe bài xem? Nhấn nút bên phải màn hình.'
                : '🎙️ Want to hear this reading? Tap the button at the bottom-right.'}
            </p>
          </div>

        </div>
      </div>

      {/* TTS floating button */}
      <MysteryVoiceButton analysis={analysis} />
    </div>
  );
}
