import React from 'react';
import CardDeck from './CardDeck';

interface CardDeckWrapperProps {
  cardCount: number;
  spreadId: string;
}

export default function CardDeckWrapper({ cardCount, spreadId }: CardDeckWrapperProps) {
  console.log('[CardDeckWrapper] Mounted with cardCount:', cardCount, 'spreadId:', spreadId);

  const handleCardsSelected = (selectedCards: any[]) => {
    console.log('[CardDeckWrapper] Cards selected:', selectedCards);
    console.log('[CardDeckWrapper] Spread ID:', spreadId);
    console.log('[CardDeckWrapper] Card count:', cardCount);

    // Encode selected cards in URL and navigate to result page
    const cardIds = selectedCards.map(sc => sc.cardId).join('-');
    const reversed = selectedCards.map(sc => sc.reversed ? '1' : '0').join('');

    const url = `/result?spread=${spreadId}&cards=${cardIds}&reversed=${reversed}`;
    console.log('[CardDeckWrapper] Navigating to:', url);
    console.log('[CardDeckWrapper] Selected cards length:', selectedCards.length, 'Expected:', cardCount);

    window.location.href = url;
  };

  return <CardDeck cardCount={cardCount} onCardsSelected={handleCardsSelected} />;
}
