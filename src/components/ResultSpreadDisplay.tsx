import React from 'react';
import SpreadLayout from './SpreadLayout';
import type { TarotSpread } from '../types/tarot';
import type { SelectedCard } from './CardDeck';

interface ResultSpreadDisplayProps {
  spread: TarotSpread;
  selectedCards: SelectedCard[];
  cardsData: any[];
}

export default function ResultSpreadDisplay({ spread, selectedCards, cardsData }: ResultSpreadDisplayProps) {
  return (
    <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 md:p-8 shadow-inner">
      <SpreadLayout
        spread={spread}
        selectedCards={selectedCards}
        cardsData={cardsData}
      />
    </div>
  );
}
