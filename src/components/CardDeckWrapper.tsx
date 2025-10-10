import React from 'react';
import CardDeck from './CardDeck';
import type { TarotSpread } from '../types/tarot';

interface CardDeckWrapperProps {
  cardCount: number;
  spreadId: string;
  spread: TarotSpread;
}

export default function CardDeckWrapper({ cardCount, spreadId, spread }: CardDeckWrapperProps) {
  const handleCardsSelected = (selectedCards: any[]) => {
    // Encode selected cards in URL path and navigate to result page
    // Format: /result/3-card/1-2-3/010
    const cardIds = selectedCards.map(sc => sc.cardId).join('-');
    const reversed = selectedCards.map(sc => sc.reversed ? '1' : '0').join('');
    const url = `/result/${spreadId}/${cardIds}/${reversed}`;

    window.location.href = url;
  };

  return <CardDeck cardCount={cardCount} spread={spread} onCardsSelected={handleCardsSelected} />;
}
