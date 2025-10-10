import { useState, useEffect } from 'react';
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

    // Create array of card IDs (0-77)
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
          {selectedCards.length === 0 && 'Click on cards to select them for your reading'}
          {selectedCards.length > 0 && selectedCards.length < cardCount &&
            `Selected ${selectedCards.length} of ${cardCount} cards`}
          {selectedCards.length === cardCount && 'All cards selected! Revealing...'}
        </p>
      </div>

      {/* Shuffle Button */}
      <div className="text-center">
        <button
          onClick={shuffleCards}
          disabled={isShuffling || selectedCards.length > 0}
          className="px-6 py-3 bg-violet-deep text-white rounded-lg hover:bg-violet-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isShuffling ? '🔄 Shuffling...' : '🎴 Shuffle Again'}
        </button>
      </div>

      {/* Card Grid */}
      <div className="relative min-h-[400px]">
        {isShuffling ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <div className="animate-spin text-6xl mb-4">🔮</div>
              <p className="text-xl text-violet-medium">Shuffling the cards...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-8 md:grid-cols-10 lg:grid-cols-13 gap-2">
            {deck.slice(0, 40).map((cardId, index) => {
              const isSelected = selectedCards.some(sc => sc.cardId === cardId);
              const canSelect = selectedCards.length < cardCount && !isSelected;

              return (
                <button
                  key={index}
                  onClick={() => selectCard(index)}
                  disabled={!canSelect}
                  className={`
                    aspect-[2/3] rounded-lg transition-all duration-300
                    ${isSelected
                      ? 'opacity-0 scale-0'
                      : canSelect
                        ? 'bg-gradient-to-br from-violet-deep to-violet-medium hover:scale-105 hover:shadow-lg cursor-pointer'
                        : 'bg-gray-300 cursor-not-allowed opacity-50'
                    }
                    ${canSelect ? 'hover:glow-gold' : ''}
                  `}
                  aria-label={`Select card ${index + 1}`}
                >
                  <div className="w-full h-full flex items-center justify-center text-white text-xs">
                    {canSelect && '🌟'}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Cards Preview */}
      {selectedCards.length > 0 && selectedCards.length < cardCount && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: cardCount }).map((_, i) => (
            <div
              key={i}
              className={`w-16 h-24 rounded-lg border-2 ${
                i < selectedCards.length
                  ? 'bg-gold-soft border-gold-soft'
                  : 'bg-gray-200 border-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
