/**
 * ReadingWizard
 * 3-step UX flow for a tarot reading:
 *   Step 1 — Intention: user reads spread positions, optionally types a question
 *             Mode toggle: random draw (default) or manual pick (already have cards)
 *   Step 2 — Draw/Pick: random fan OR searchable card grid for manual mode
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
type ReadingMode = 'random' | 'manual';

// All 78 cards for the picker
const ALL_CARDS = cardsData as Array<{ id: number; name: string; suit: string | null; arcana: string; image: string; keywords: string[] }>;

export default function ReadingWizard({ cardCount, spreadId, spread }: ReadingWizardProps) {
  const [step, setStep] = useState<WizardStep>('intention');
  const [mode, setMode] = useState<ReadingMode>('random');
  const [question, setQuestion] = useState('');
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([]);
  const [deck, setDeck] = useState<number[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Manual mode state
  const [search, setSearch] = useState('');
  const [pendingReversed, setPendingReversed] = useState(false);
  const [pickingFor, setPickingFor] = useState<number | null>(null); // position index (0-based)
  const [pendingCardId, setPendingCardId] = useState<number | null>(null); // card awaiting upright/reversed choice

  const lang = i18n.getCurrentLanguage();

  // Read mode from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'manual') {
        setMode('manual');
      }
    }
  }, []);

  // When entering manual mode step 2, start picking for position 0
  useEffect(() => {
    if (step === 'draw' && mode === 'manual') {
      setPickingFor(0);
    }
  }, [step, mode]);

  const labels = lang === 'vi'
    ? {
        step1Badge: 'Bước 1 — Đặt Ý Định',
        step2Badge: 'Bước 2 — Rút Bài',
        step2ManualBadge: 'Bước 2 — Chọn Lá Bài',
        positionsHeading: 'Các Vị Trí Trong Bài',
        questionLabel: 'Câu Hỏi Của Bạn (tuỳ chọn)',
        questionHint: 'Tập trung tâm trí. Bạn đang tìm kiếm hướng dẫn về điều gì?',
        questionPlaceholder: 'Bạn cần lời khuyên gì?',
        shuffleBtn: 'Xáo Bài & Bắt Đầu',
        manualBtn: 'Nhập Lá Bài Của Tôi',
        backBtn: '← Chọn bài khác',
        yourQuestion: 'Câu hỏi của bạn',
        drawingCard: (current: number, total: number) => `Đang rút lá ${current} / ${total}`,
        pickingCard: (current: number, total: number) => `Chọn lá ${current} / ${total}`,
        shuffleAgain: 'Xáo lại',
        shufflingText: 'Đang xáo bài...',
        navigatingText: 'Đã rút đủ bài! Đang chuyển đến kết quả…',
        progress: 'Tiến độ',
        modeRandom: '🔀 Rút Ngẫu Nhiên',
        modeManual: '🃏 Tôi Đã Có Bài',
        modeRandomDesc: 'Xáo bài và bốc ngẫu nhiên',
        modeManualDesc: 'Đã bốc bài thực tế — tôi tự chọn lá',
        searchPlaceholder: 'Tìm tên lá bài…',
        reversed: 'Ngược',
        upright: 'Ngửa',
        reversedToggle: 'Lá bài này ngược chiều?',
        pickFor: (name: string) => `Chọn lá cho: ${name}`,
        alreadyPicked: 'Đã chọn',
        confirmCard: 'Xác Nhận Lá Này',
        changeCard: 'Đổi Lá',
        filterAll: 'Tất cả',
        filterMajor: 'Bài Lớn',
        filterWands: 'Gậy',
        filterCups: 'Chén',
        filterSwords: 'Kiếm',
        filterPentacles: 'Xu',
      }
    : {
        step1Badge: 'Step 1 — Set Your Intention',
        step2Badge: 'Step 2 — Draw Your Cards',
        step2ManualBadge: 'Step 2 — Select Your Cards',
        positionsHeading: 'Spread Positions',
        questionLabel: 'Your Question (optional)',
        questionHint: 'Focus your mind. What are you seeking guidance on?',
        questionPlaceholder: 'What guidance do you seek?',
        shuffleBtn: 'Shuffle the Deck & Begin',
        manualBtn: 'Enter My Cards',
        backBtn: '← Choose a different spread',
        yourQuestion: 'Your question',
        drawingCard: (current: number, total: number) => `Drawing card ${current} of ${total}`,
        pickingCard: (current: number, total: number) => `Select card ${current} of ${total}`,
        shuffleAgain: 'Shuffle',
        shufflingText: 'Shuffling...',
        navigatingText: 'All cards drawn! Taking you to your reading…',
        progress: 'Progress',
        modeRandom: '🔀 Random Draw',
        modeManual: '🃏 I Have My Cards',
        modeRandomDesc: 'Shuffle and draw from the deck',
        modeManualDesc: 'I drew physical cards — I\'ll pick them myself',
        searchPlaceholder: 'Search card name…',
        reversed: 'Reversed',
        upright: 'Upright',
        reversedToggle: 'This card is reversed?',
        pickFor: (name: string) => `Pick card for: ${name}`,
        alreadyPicked: 'Already picked',
        confirmCard: 'Confirm This Card',
        changeCard: 'Change Card',
        filterAll: 'All',
        filterMajor: 'Major',
        filterWands: 'Wands',
        filterCups: 'Cups',
        filterSwords: 'Swords',
        filterPentacles: 'Pentacles',
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

  // When entering step 2, trigger the initial shuffle (random mode only)
  const startDraw = () => {
    setStep('draw');
    if (mode === 'random') {
      doShuffle();
    }
  };

  // ── Navigate to result ────────────────────────────────────────────────────
  const navigateToResult = (cards: SelectedCard[]) => {
    setIsNavigating(true);
    const cardIds = cards.map(sc => sc.cardId).join('-');
    const reversedStr = cards.map(sc => sc.reversed ? '1' : '0').join('');
    const currentUrl = new URL(window.location.href);
    const langParam = currentUrl.searchParams.get('lang');
    let url = `/result/${spreadId}/${cardIds}/${reversedStr}`;
    const qs = new URLSearchParams();
    if (question.trim()) qs.set('question', question.trim());
    if (langParam) qs.set('lang', langParam);
    const qsStr = qs.toString();
    if (qsStr) url += `?${qsStr}`;
    setTimeout(() => { window.location.href = url; }, 800);
  };

  // ── Random draw: select a card from the fan ───────────────────────────────
  const selectCard = (index: number) => {
    if (selectedCards.length >= cardCount || isNavigating) return;

    const cardId = deck[index];
    const reversed = isReversed();
    const newCard: SelectedCard = { cardId, reversed, position: selectedCards.length + 1 };
    const newSelection = [...selectedCards, newCard];
    setSelectedCards(newSelection);

    if (newSelection.length === cardCount) {
      navigateToResult(newSelection);
    }
  };

  // ── Manual pick: select a card from the grid ─────────────────────────────
  const pickManualCard = (cardId: number, reversed: boolean) => {
    if (pickingFor === null || isNavigating) return;
    // Replace if already picked for this position
    const existing = [...selectedCards];
    existing[pickingFor] = { cardId, reversed, position: pickingFor + 1 };
    setSelectedCards(existing);
    setPendingReversed(false);

    if (existing.filter(Boolean).length === cardCount) {
      navigateToResult(existing);
    } else {
      // Advance to next unfilled position
      const currentPos = pickingFor;
      const nextEmpty = existing.findIndex((c, i) => i > currentPos && !c);
      setPickingFor(nextEmpty === -1 ? null : nextEmpty);
    }
  };

  // Already picked card ids for the manual picker
  const pickedCardIds = new Set(selectedCards.filter(Boolean).map(sc => sc?.cardId));

  const drawnCount = selectedCards.filter(Boolean).length;
  const activePosition = drawnCount < cardCount ? drawnCount + 1 : undefined;
  const nextPosition = spread.positions[drawnCount];
  const canDraw = drawnCount < cardCount && !isNavigating && !isShuffling;

  // ── Manual mode: filter cards ─────────────────────────────────────────────
  const [suitFilter, setSuitFilter] = useState<string>('all');

  const filteredCards = ALL_CARDS.filter(card => {
    const matchSearch = search.trim() === '' || card.name.toLowerCase().includes(search.toLowerCase());
    const matchSuit =
      suitFilter === 'all' ? true :
      suitFilter === 'major' ? card.arcana === 'major' :
      card.suit === suitFilter;
    return matchSearch && matchSuit;
  });

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

        {/* Mode toggle */}
        <div className="mb-8">
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setMode('random')}
              className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                mode === 'random'
                  ? 'border-violet-deep bg-violet-deep/10 text-violet-deep shadow-md'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-violet-light'
              }`}
            >
              <span className="text-lg">🔀</span>
              <span>{lang === 'vi' ? 'Rút Ngẫu Nhiên' : 'Random Draw'}</span>
              <span className="text-xs font-normal text-gray-400">{labels.modeRandomDesc}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                mode === 'manual'
                  ? 'border-violet-deep bg-violet-deep/10 text-violet-deep shadow-md'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-violet-light'
              }`}
            >
              <span className="text-lg">🃏</span>
              <span>{lang === 'vi' ? 'Tôi Đã Có Bài' : 'I Have My Cards'}</span>
              <span className="text-xs font-normal text-gray-400">{labels.modeManualDesc}</span>
            </button>
          </div>
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
            {mode === 'manual' ? `🃏 ${labels.manualBtn}` : `✨ ${labels.shuffleBtn}`}
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

  // ── STEP 2: Manual Pick ───────────────────────────────────────────────────
  if (mode === 'manual') {
    const currentPickPosition = pickingFor !== null ? spread.positions[pickingFor] : null;
    const currentPickCard = pickingFor !== null && selectedCards[pickingFor]
      ? ALL_CARDS.find(c => c.id === selectedCards[pickingFor]?.cardId)
      : null;

    return (
      <div className="max-w-5xl mx-auto">

        {/* Step badge */}
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-soft/15 text-violet-deep text-sm font-semibold">
            <span className="w-6 h-6 rounded-full bg-gold-soft text-white text-xs flex items-center justify-center font-bold">2</span>
            {labels.step2ManualBadge}
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

        {/* Spread layout preview */}
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-3 md:p-5 mb-6 border border-violet-100 shadow-inner">
          <SpreadLayout
            spread={spread}
            selectedCards={selectedCards.filter(Boolean) as SelectedCard[]}
            cardsData={cardsData as any[]}
            activePosition={pickingFor !== null ? pickingFor + 1 : undefined}
          />
        </div>

        {/* Navigating message */}
        {isNavigating && (
          <div className="text-center py-6">
            <p className="text-lg text-violet-medium font-heading animate-pulse">{labels.navigatingText}</p>
          </div>
        )}

        {!isNavigating && (
          <>
            {/* Active position banner */}
            {currentPickPosition && (
              <div className="max-w-xl mx-auto mb-5">
                <div className="flex items-center gap-3 bg-gradient-to-r from-gold-soft/20 to-violet-100 border border-gold-soft/50 rounded-xl px-5 py-3 shadow-sm">
                  <span className="text-2xl flex-shrink-0">✨</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gold-soft uppercase tracking-wider">
                      {labels.pickingCard(drawnCount + 1, cardCount)}
                    </p>
                    <p className="text-sm font-bold text-violet-deep">{currentPickPosition.name}</p>
                    <p className="text-xs text-gray-500">{currentPickPosition.description}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 italic">
                    {lang === 'vi' ? 'Click lá bài → chọn xuôi/ngược' : 'Click a card → pick upright/reversed'}
                  </span>
                </div>
              </div>
            )}

            {/* Position tabs — click to re-pick any position */}
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {spread.positions.map((pos, i) => {
                const pickedCard = selectedCards[i]
                  ? ALL_CARDS.find(c => c.id === selectedCards[i]?.cardId)
                  : null;
                const isActive = pickingFor === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setPickingFor(i);
                      setPendingReversed(selectedCards[i]?.reversed ?? false);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                      isActive
                        ? 'border-gold-soft bg-gold-soft/20 text-violet-deep shadow'
                        : pickedCard
                          ? 'border-violet-200 bg-violet-50 text-violet-deep'
                          : 'border-gray-200 bg-white text-gray-400'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-violet-deep text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {pos.position}
                    </span>
                    <span className="max-w-[80px] truncate">{pos.name}</span>
                    {pickedCard && (
                      <span className="text-[10px] text-violet-medium truncate max-w-[60px]">
                        {pickedCard.name}{selectedCards[i]?.reversed ? ' ↩' : ''}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search + filter */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={labels.searchPlaceholder}
                className="flex-1 rounded-lg border-2 border-violet-200 focus:border-violet-deep focus:outline-none px-3 py-2 text-sm text-gray-800 transition-colors"
              />
              <div className="flex gap-1 flex-wrap">
                {[
                  { key: 'all', label: labels.filterAll },
                  { key: 'major', label: labels.filterMajor },
                  { key: 'wands', label: labels.filterWands },
                  { key: 'cups', label: labels.filterCups },
                  { key: 'swords', label: labels.filterSwords },
                  { key: 'pentacles', label: labels.filterPentacles },
                ].map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setSuitFilter(f.key)}
                    className={`px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      suitFilter === f.key
                        ? 'bg-violet-deep text-white border-violet-deep'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-violet-light'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Card grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-2 max-h-[480px] overflow-y-auto pr-1 rounded-xl">
              {filteredCards.map(card => {
                const alreadyPicked = pickedCardIds.has(card.id);
                const isThisPositionCard = pickingFor !== null && selectedCards[pickingFor]?.cardId === card.id;
                const isPending = pendingCardId === card.id;

                return (
                  <div
                    key={card.id}
                    className={`relative flex flex-col rounded-lg overflow-hidden border-2 transition-all duration-200
                      ${isPending
                        ? 'border-violet-deep shadow-xl scale-105 z-10'
                        : isThisPositionCard
                          ? 'border-gold-soft ring-2 ring-gold-soft shadow-lg'
                          : alreadyPicked
                            ? 'border-violet-200 opacity-40'
                            : 'border-transparent hover:border-violet-deep hover:shadow-md'
                      }
                    `}
                  >
                    <button
                      type="button"
                      disabled={alreadyPicked && !isThisPositionCard && !isPending}
                      onClick={() => {
                        if (alreadyPicked && !isThisPositionCard) return;
                        setPendingCardId(isPending ? null : card.id);
                      }}
                      title={`${card.name}${alreadyPicked && !isThisPositionCard ? ` (${labels.alreadyPicked})` : ''}`}
                      className={`relative group ${alreadyPicked && !isThisPositionCard ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full aspect-[2/3] object-cover"
                        loading="lazy"
                      />
                      {/* Card name on hover */}
                      <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[9px] leading-tight px-1 py-0.5 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {card.name}
                      </span>
                      {isThisPositionCard && !isPending && (
                        <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-gold-soft rounded-full flex items-center justify-center text-white text-[10px] font-bold">✓</span>
                      )}
                      {alreadyPicked && !isThisPositionCard && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <span className="bg-black/60 text-white text-[10px] rounded px-1">✓</span>
                        </span>
                      )}
                    </button>

                    {/* Upright / Reversed choice — shown inline when this card is pending */}
                    {isPending && (
                      <div className="flex flex-col gap-1 p-1 bg-white">
                        <p className="text-[9px] text-center text-gray-500 font-medium truncate">{card.name}</p>
                        <button
                          type="button"
                          onClick={() => { pickManualCard(card.id, false); setPendingCardId(null); }}
                          className="w-full py-1 rounded bg-violet-deep text-white text-[10px] font-semibold hover:bg-violet-medium transition-colors"
                        >
                          ↑ {labels.upright}
                        </button>
                        <button
                          type="button"
                          onClick={() => { pickManualCard(card.id, true); setPendingCardId(null); }}
                          className="w-full py-1 rounded bg-gray-600 text-white text-[10px] font-semibold hover:bg-gray-700 transition-colors"
                        >
                          ↓ {labels.reversed}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Progress bar */}
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
      </div>
    );
  }

  // ── STEP 2: Random Draw ───────────────────────────────────────────────────
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
