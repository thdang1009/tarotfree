/**
 * ReadingWizard
 * 3-step UX flow for a tarot reading:
 *   Step 1 — Intention: user reads spread positions, optionally types a question
 *   Step 2 — Draw: user draws cards one-by-one, always knowing which slot they're filling
 */

import React, { useState, useEffect } from 'react';
import SpreadLayout from './SpreadLayout';
import type { TarotSpread } from '../types/tarot';
import type { SelectedCard } from './CardDeck';
import { shuffleDeck, isReversed } from '../utils/rng';
import { i18n } from '../utils/i18n';
import cardsData from '../data/cards.json';

interface ReadingWizardProps {
  cardCount: number;
  spreadId: string;
  spread: TarotSpread;
}

type WizardStep = 'intention' | 'draw';

export default function ReadingWizard({ cardCount, spreadId, spread }: ReadingWizardProps) {
  const [step, setStep] = useState<WizardStep>('intention');
  const [question, setQuestion] = useState('');
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([]);
  const [deck, setDeck] = useState<number[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const lang = i18n.getCurrentLanguage();

  const labels = lang === 'vi'
    ? {
        step1Badge: 'Bước 1 — Đặt Ý Định',
        step2Badge: 'Bước 2 — Rút Bài',
        positionsHeading: 'Các Vị Trí Trong Bài',
        questionLabel: 'Câu Hỏi Của Bạn (tuỳ chọn)',
        questionHint: 'Tập trung tâm trí. Bạn đang tìm kiếm hướng dẫn về điều gì?',
        questionPlaceholder: 'Bạn cần lời khuyên gì?',
        shuffleBtn: 'Xáo Bài & Bắt Đầu',
        backBtn: '← Chọn bài khác',
        yourQuestion: 'Câu hỏi của bạn',
        drawingCard: (current: number, total: number) => `Đang rút lá ${current} / ${total}`,
        shuffleAgain: 'Xáo lại',
        shufflingText: 'Đang xáo bài...',
        navigatingText: 'Đã rút đủ bài! Đang chuyển đến kết quả…',
        progress: 'Tiến độ',
      }
    : {
        step1Badge: 'Step 1 — Set Your Intention',
        step2Badge: 'Step 2 — Draw Your Cards',
        positionsHeading: 'Spread Positions',
        questionLabel: 'Your Question (optional)',
        questionHint: 'Focus your mind. What are you seeking guidance on?',
        questionPlaceholder: 'What guidance do you seek?',
        shuffleBtn: 'Shuffle the Deck & Begin',
        backBtn: '← Choose a different spread',
        yourQuestion: 'Your question',
        drawingCard: (current: number, total: number) => `Drawing card ${current} of ${total}`,
        shuffleAgain: 'Shuffle',
        shufflingText: 'Shuffling...',
        navigatingText: 'All cards drawn! Taking you to your reading…',
        progress: 'Progress',
      };

  // ── Shuffle deck ──────────────────────────────────────────────────────────
  const doShuffle = () => {
    setIsShuffling(true);
    setSelectedCards([]);
    const cardIds = Array.from({ length: 78 }, (_, i) => i);
    const shuffled = shuffleDeck(cardIds);
    setTimeout(() => {
      setDeck(shuffled);
      setIsShuffling(false);
    }, 2000);
  };

  // When entering step 2, trigger the initial shuffle
  const startDraw = () => {
    setStep('draw');
    doShuffle();
  };

  // ── Draw a card ───────────────────────────────────────────────────────────
  const selectCard = (index: number) => {
    if (selectedCards.length >= cardCount || isNavigating) return;

    const cardId = deck[index];
    const reversed = isReversed();
    const newCard: SelectedCard = { cardId, reversed, position: selectedCards.length + 1 };
    const newSelection = [...selectedCards, newCard];
    setSelectedCards(newSelection);

    if (newSelection.length === cardCount) {
      setIsNavigating(true);
      const cardIds = newSelection.map(sc => sc.cardId).join('-');
      const reversedStr = newSelection.map(sc => sc.reversed ? '1' : '0').join('');
      const currentUrl = new URL(window.location.href);
      const langParam = currentUrl.searchParams.get('lang');
      let url = `/result/${spreadId}/${cardIds}/${reversedStr}`;
      const qs = new URLSearchParams();
      if (question.trim()) qs.set('question', question.trim());
      if (langParam) qs.set('lang', langParam);
      const qsStr = qs.toString();
      if (qsStr) url += `?${qsStr}`;
      setTimeout(() => { window.location.href = url; }, 800);
    }
  };

  const drawnCount = selectedCards.length;
  // 1-based active position for SpreadLayout highlight
  const activePosition = drawnCount < cardCount ? drawnCount + 1 : undefined;
  const nextPosition = spread.positions[drawnCount];
  const canDraw = drawnCount < cardCount && !isNavigating && !isShuffling;

  // ── STEP 1: Intention ─────────────────────────────────────────────────────
  if (step === 'intention') {
    return (
      <div className="max-w-3xl mx-auto">
        {/* Step badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-deep/10 text-violet-deep text-sm font-semibold">
            <span className="w-6 h-6 rounded-full bg-violet-deep text-white text-xs flex items-center justify-center font-bold">1</span>
            {labels.step1Badge}
          </span>
        </div>

        {/* Spread description */}
        <p className="text-center text-gray-600 mb-8 text-base leading-relaxed">
          {spread.description}
        </p>

        {/* Positions list */}
        <div className="mb-8">
          <h3 className="text-lg font-heading text-violet-medium mb-4 text-center">
            🃏 {labels.positionsHeading}
          </h3>
          <div className="grid gap-3">
            {spread.positions.map((pos) => (
              <div
                key={pos.position}
                className="flex items-start gap-4 bg-white rounded-lg px-5 py-3 shadow-sm border border-violet-100"
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-deep text-white text-sm font-bold flex items-center justify-center mt-0.5">
                  {pos.position}
                </span>
                <div>
                  <p className="font-semibold text-violet-deep text-sm">{pos.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{pos.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Question input */}
        <div className="mb-8">
          <label htmlFor="wizard-question" className="block text-sm font-semibold text-violet-deep mb-1">
            🔮 {labels.questionLabel}
          </label>
          <p className="text-xs text-gray-500 mb-2">{labels.questionHint}</p>
          <textarea
            id="wizard-question"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={labels.questionPlaceholder}
            className="w-full rounded-lg border-2 border-violet-200 focus:border-violet-deep focus:outline-none px-4 py-3 text-sm text-gray-800 resize-none transition-colors"
          />
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <button
            type="button"
            onClick={startDraw}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-violet-deep to-violet-medium text-white font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 text-base"
          >
            ✨ {labels.shuffleBtn}
          </button>
        </div>

        <div className="text-center mt-5">
          <a href="/" className="text-sm text-gray-400 hover:text-violet-medium transition-colors">
            {labels.backBtn}
          </a>
        </div>
      </div>
    );
  }

  // ── STEP 2: Draw ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto">

      {/* Step badge */}
      <div className="flex justify-center mb-4">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-soft/15 text-violet-deep text-sm font-semibold">
          <span className="w-6 h-6 rounded-full bg-gold-soft text-white text-xs flex items-center justify-center font-bold">2</span>
          {labels.step2Badge}
        </span>
      </div>

      {/* Question recap */}
      {question.trim() && (
        <div className="max-w-xl mx-auto mb-5">
          <div className="bg-violet-deep/5 border-l-4 border-violet-deep rounded-r-lg px-4 py-3">
            <p className="text-xs text-violet-medium font-semibold uppercase tracking-wide mb-1">
              {labels.yourQuestion}
            </p>
            <p className="text-sm text-gray-700 italic">"{question.trim()}"</p>
          </div>
        </div>
      )}

      {/* Active slot banner */}
      {!isShuffling && !isNavigating && nextPosition && canDraw && (
        <div className="max-w-xl mx-auto mb-5">
          <div className="flex items-center gap-3 bg-gradient-to-r from-gold-soft/20 to-violet-100 border border-gold-soft/50 rounded-xl px-5 py-3 shadow-sm">
            <span className="text-2xl flex-shrink-0">✨</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gold-soft uppercase tracking-wider">
                {labels.drawingCard(drawnCount + 1, cardCount)}
              </p>
              <p className="text-sm font-bold text-violet-deep">{nextPosition.name}</p>
              <p className="text-xs text-gray-500">{nextPosition.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Spread layout preview */}
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-3 md:p-5 mb-6 border border-violet-100 shadow-inner">
        <SpreadLayout
          spread={spread}
          selectedCards={selectedCards}
          cardsData={cardsData as any[]}
          activePosition={activePosition}
        />
      </div>

      {/* Shuffling animation */}
      {isShuffling && (
        <div className="text-center py-12">
          <div className="relative w-48 h-48 mx-auto mb-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 animate-spin-slow"
                style={{ animationDelay: `${i * 0.15}s`, animationDuration: '2s', opacity: 0.7 - i * 0.08 }}
              >
                <div
                  className="w-20 h-32 mx-auto bg-gradient-to-br from-violet-900 to-purple-800 rounded-lg border-2 border-gold-soft"
                  style={{ transform: `rotate(${i * 45}deg)` }}
                />
              </div>
            ))}
            <div className="absolute inset-0 flex items-center justify-center animate-pulse">
              <div className="text-6xl">🔮</div>
            </div>
          </div>
          <p className="text-2xl text-violet-medium animate-pulse font-heading">{labels.shufflingText}</p>
        </div>
      )}

      {/* Navigating message */}
      {isNavigating && (
        <div className="text-center py-6">
          <p className="text-lg text-violet-medium font-heading animate-pulse">{labels.navigatingText}</p>
        </div>
      )}

      {/* Fan deck */}
      {!isShuffling && !isNavigating && deck.length > 0 && canDraw && (
        <div className="relative w-full flex items-end justify-center">
          <div className="relative w-full max-w-[95vw] md:max-w-[750px]" style={{ height: '220px' }}>
            {deck.map((cardId, index) => {
              const isSelected = selectedCards.some(sc => sc.cardId === cardId);
              const canSelect = !isSelected && canDraw;

              const totalCards = 78;
              const spreadAngle = 140;
              const startAngle = -spreadAngle / 2;
              const angleStep = spreadAngle / (totalCards - 1);
              const rotation = startAngle + angleStep * index;
              const baseRadius =
                typeof window !== 'undefined' && window.innerWidth < 640 ? 150 :
                typeof window !== 'undefined' && window.innerWidth < 768 ? 180 : 220;
              const translateX = Math.sin((rotation * Math.PI) / 180) * baseRadius;
              const translateY = -Math.abs(Math.cos((rotation * Math.PI) / 180)) * 55;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => canSelect && selectCard(index)}
                  disabled={!canSelect}
                  style={{
                    transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg) ${isSelected ? 'scale(0)' : 'scale(1)'}`,
                    zIndex: isSelected ? 0 : totalCards - Math.abs(index - totalCards / 2),
                  }}
                  className={`
                    absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-12 h-18 sm:w-14 sm:h-20 md:w-20 md:h-32 rounded-md transition-all duration-300 overflow-hidden
                    ${isSelected
                      ? 'opacity-0 pointer-events-none'
                      : canSelect
                        ? 'hover:scale-150 hover:z-[1000] cursor-pointer shadow-lg hover:shadow-2xl border-2 border-gold-soft hover:border-gold-light'
                        : 'cursor-not-allowed opacity-30'
                    }
                  `}
                  aria-label={`Draw card ${index + 1}`}
                >
                  <div className="w-full h-full bg-gradient-to-br from-violet-900 to-purple-800">
                    <img
                      src="/images/cards/cardback.jpg"
                      alt="Card back"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Shuffle again */}
          <div className="absolute top-2 right-2 md:top-4 md:right-4">
            <button
              type="button"
              onClick={doShuffle}
              className="px-4 py-2 bg-violet-deep text-white text-sm rounded-full hover:bg-violet-medium transition-all shadow-lg hover:shadow-xl hover:scale-110 flex items-center gap-2"
            >
              <span className="text-lg">🔄</span>
              <span className="hidden sm:inline">{labels.shuffleAgain}</span>
            </button>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {!isShuffling && deck.length > 0 && (
        <div className="max-w-md mx-auto mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">{labels.progress}</span>
            <span className="text-sm font-semibold text-violet-deep">
              {drawnCount} / {cardCount}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-violet-deep to-gold-soft h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(drawnCount / cardCount) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
