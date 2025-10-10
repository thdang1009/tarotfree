import React, { useState, useEffect } from 'react';
import { shuffleDeck, isReversed } from '../utils/rng';
import cardsData from '../data/cards.json';
import SpreadLayout from './SpreadLayout';
import type { TarotSpread } from '../types/tarot';

interface CardDeckProps {
  cardCount: number;
  spread: TarotSpread;
  onCardsSelected: (selectedCards: SelectedCard[]) => void;
}

export interface SelectedCard {
  cardId: number;
  reversed: boolean;
  position: number;
}

export default function CardDeck({ cardCount, spread, onCardsSelected }: CardDeckProps) {
  const [deck, setDeck] = useState<number[]>([]);
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  // Initialize and shuffle deck on mount
  useEffect(() => {
    shuffleCards();
  }, []);

  const shuffleCards = () => {
    setIsShuffling(true);
    setSelectedCards([]);
    setIsRevealing(false);

    // Create array of card IDs (0-77) - ALL 78 cards
    const cardIds = Array.from({ length: 78 }, (_, i) => i);
    const shuffled = shuffleDeck(cardIds);

    setTimeout(() => {
      setDeck(shuffled);
      setIsShuffling(false);
    }, 2000); // Longer animation time
  };

  const selectCard = (index: number) => {
    // Can only select the next card in sequence
    if (selectedCards.length >= cardCount) {
      return;
    }

    const cardId = deck[index];
    const reversed = isReversed();

    const newCard: SelectedCard = {
      cardId,
      reversed,
      position: selectedCards.length + 1,
    };

    const newSelection = [...selectedCards, newCard];
    setSelectedCards(newSelection);

    // If we've selected all cards, notify parent after a delay
    if (newSelection.length === cardCount) {
      setIsRevealing(true);
      setTimeout(() => {
        onCardsSelected(newSelection);
      }, 1000);
    }
  };

  // Calculate how many cards to show in the deck
  const remainingCards = cardCount - selectedCards.length;
  const canDrawNext = remainingCards > 0 && !isRevealing;

  return (
    <div>
      {/* Shuffling Animation */}
      {isShuffling && (
        <div className="text-center py-12">
          <div className="relative w-48 h-48 mx-auto mb-6">
            {/* Multiple spinning cards for beautiful shuffle effect */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 animate-spin-slow"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '2s',
                  opacity: 0.7 - i * 0.08,
                }}
              >
                <div
                  className="w-20 h-32 mx-auto bg-gradient-to-br from-violet-900 to-purple-800 rounded-lg border-2 border-gold-soft transform"
                  style={{
                    transform: `rotate(${i * 45}deg)`,
                  }}
                />
              </div>
            ))}
            {/* Center crystal ball */}
            <div className="absolute inset-0 flex items-center justify-center animate-pulse">
              <div className="text-6xl">🔮</div>
            </div>
          </div>
          <p className="text-2xl text-violet-medium animate-pulse font-heading">Shuffling...</p>
        </div>
      )}

      {/* Main Content - Spread and Deck */}
      {!isShuffling && deck.length > 0 && (
        <div>

          {/* Card Deck - Fan Spread Style with Shuffle Button */}
          {canDrawNext && (
            <div className="relative w-full flex items-end justify-center">
              <div className="relative w-full max-w-[95vw] md:max-w-[750px]" style={{ height: '220px' }}>
                {/* All 78 cards in fan spread - always */}
                {deck.map((cardId, index) => {
                  const isSelected = selectedCards.some(sc => sc.cardId === cardId);
                  const canSelect = !isSelected && canDrawNext;

                  // Calculate spread angle for fan effect - all 78 cards
                  const totalCards = 78;
                  const spreadAngle = 140; // Wide angle for full deck
                  const startAngle = -spreadAngle / 2;
                  const angleStep = spreadAngle / (totalCards - 1);
                  const rotation = startAngle + (angleStep * index);

                  // Responsive radius - smaller on mobile
                  const baseRadius = typeof window !== 'undefined' && window.innerWidth < 640 ? 150 :
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
                      {/* Card Back */}
                      <div className="w-full h-full bg-gradient-to-br from-violet-900 to-purple-800 flex items-center justify-center relative">
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

              {/* Shuffle Button - Positioned on the right */}
              <div className="absolute top-2 right-2 md:top-4 md:right-4">
                <button
                  type="button"
                  onClick={shuffleCards}
                  className="px-4 py-2 bg-violet-deep text-white text-sm rounded-full hover:bg-violet-medium transition-all shadow-lg hover:shadow-xl hover:scale-110 flex items-center gap-2"
                  title="Shuffle deck"
                >
                  <span className="text-lg">🔄</span>
                  <span className="hidden sm:inline">Shuffle</span>
                </button>
              </div>
            </div>
          )}

          {/* Spread Layout - Shows drawn cards and placeholders */}
          <div className="w-full">
            <SpreadLayout
              spread={spread}
              selectedCards={selectedCards}
              cardsData={cardsData as any[]}
            />
          </div>

        </div>
      )}

      {/* Progress Indicator */}
      {!isShuffling && deck.length > 0 && (
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-semibold text-violet-deep">
              {selectedCards.length} / {cardCount}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-violet-deep to-gold-soft h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(selectedCards.length / cardCount) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
