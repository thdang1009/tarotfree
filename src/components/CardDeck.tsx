import React, { useState, useEffect } from 'react';
import { shuffleDeck, isReversed } from '../utils/rng';

interface CardDeckProps {
  cardCount: number;
  onCardsSelected: (selectedCards: SelectedCard[]) => void;
}

export interface SelectedCard {
  cardId: number;
  reversed: boolean;
  position: number;
}

export default function CardDeck({ cardCount, onCardsSelected }: CardDeckProps) {
  const [deck, setDeck] = useState<number[]>([]);
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);

  // Initialize and shuffle deck on mount
  useEffect(() => {
    shuffleCards();
  }, []);

  const shuffleCards = () => {
    setIsShuffling(true);
    setSelectedCards([]);

    // Create array of card IDs (0-77) - ALL 78 cards
    const cardIds = Array.from({ length: 78 }, (_, i) => i);
    const shuffled = shuffleDeck(cardIds);

    setTimeout(() => {
      setDeck(shuffled);
      setIsShuffling(false);
    }, 1000);
  };

  const selectCard = (index: number) => {
    if (selectedCards.length >= cardCount) return;

    const cardId = deck[index];
    const reversed = isReversed();

    const newCard: SelectedCard = {
      cardId,
      reversed,
      position: selectedCards.length + 1,
    };

    const newSelection = [...selectedCards, newCard];
    setSelectedCards(newSelection);

    // If we've selected all cards, notify parent
    if (newSelection.length === cardCount) {
      setTimeout(() => {
        onCardsSelected(newSelection);
      }, 500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="text-center">
        <p className="text-lg text-gray-700">
          {selectedCards.length === 0 && 'Click on the deck to draw your cards'}
          {selectedCards.length > 0 && selectedCards.length < cardCount &&
            `Selected ${selectedCards.length} of ${cardCount} cards - Click the deck to draw more`}
          {selectedCards.length === cardCount && 'All cards selected! Revealing your reading...'}
        </p>
      </div>

      {/* Shuffle Button */}
      <div className="text-center">
        <button
          onClick={shuffleCards}
          disabled={isShuffling || selectedCards.length > 0}
          className="px-6 py-3 bg-violet-deep text-white rounded-lg hover:bg-violet-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isShuffling ? '🔄 Shuffling...' : '🎴 Shuffle the Deck'}
        </button>
      </div>

      {/* Card Deck - Spread Style */}
      <div className="relative min-h-[300px] flex items-center justify-center">
        {isShuffling ? (
          <div className="text-center">
            <div className="animate-spin text-6xl mb-4">🔮</div>
            <p className="text-xl text-violet-medium">Shuffling the cards...</p>
          </div>
        ) : (
          <div className="relative">
            {/* Deck of Cards - Spread Fan Style */}
            <div className="relative w-[400px] h-[250px] mx-auto">
              {deck.slice(0, 20).map((cardId, index) => {
                const isSelected = selectedCards.some(sc => sc.cardId === cardId);
                const canSelect = selectedCards.length < cardCount && !isSelected;

                // Calculate spread angle for fan effect
                const totalCards = 20;
                const spreadAngle = 60; // degrees
                const startAngle = -spreadAngle / 2;
                const angleStep = spreadAngle / (totalCards - 1);
                const rotation = startAngle + (angleStep * index);
                const translateX = Math.sin((rotation * Math.PI) / 180) * 100;
                const translateY = -Math.abs(Math.cos((rotation * Math.PI) / 180)) * 30;

                return (
                  <button
                    key={index}
                    onClick={() => !isSelected && canSelect && selectCard(index)}
                    disabled={!canSelect || isSelected}
                    style={{
                      transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg) ${isSelected ? 'scale(0)' : 'scale(1)'}`,
                      zIndex: isSelected ? 0 : index,
                    }}
                    className={`
                      absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-24 h-36 rounded-lg transition-all duration-300
                      ${isSelected
                        ? 'opacity-0'
                        : canSelect
                          ? 'bg-gradient-to-br from-violet-deep to-violet-medium hover:scale-110 hover:z-50 cursor-pointer shadow-lg'
                          : 'bg-gray-400 cursor-not-allowed opacity-40'
                      }
                    `}
                    aria-label={`Draw card ${index + 1}`}
                  >
                    <div className="w-full h-full flex items-center justify-center text-white text-4xl">
                      {canSelect ? '🎴' : ''}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Hint Text */}
            <div className="text-center mt-8 text-sm text-gray-500">
              Click on any card from the spread to draw it
            </div>
          </div>
        )}
      </div>

      {/* Selected Cards Display */}
      {selectedCards.length > 0 && (
        <div className="mt-8">
          <h3 className="text-center text-lg font-semibold text-violet-deep mb-4">
            Your Selected Cards
          </h3>
          <div className="flex justify-center gap-4 flex-wrap">
            {selectedCards.map((card, i) => (
              <div
                key={i}
                className="text-center"
              >
                <div className="w-20 h-28 rounded-lg bg-gold-soft border-4 border-gold-light shadow-lg flex items-center justify-center text-white text-3xl">
                  🎴
                </div>
                <p className="text-sm text-gray-600 mt-2">Card {i + 1}</p>
              </div>
            ))}
            {selectedCards.length < cardCount && Array.from({ length: cardCount - selectedCards.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="text-center opacity-40"
              >
                <div className="w-20 h-28 rounded-lg bg-gray-200 border-2 border-gray-300 border-dashed flex items-center justify-center text-gray-400 text-2xl">
                  ?
                </div>
                <p className="text-sm text-gray-400 mt-2">Card {selectedCards.length + i + 1}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
