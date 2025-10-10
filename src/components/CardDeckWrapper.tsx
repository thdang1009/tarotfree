import React from 'react';
import CardDeck from './CardDeck';

interface CardDeckWrapperProps {
  cardCount: number;
  spreadId: string;
}

export default function CardDeckWrapper({ cardCount, spreadId }: CardDeckWrapperProps) {
  const handleCardsSelected = (selectedCards: any[]) => {
    console.log('Cards selected:', selectedCards);
    console.log('Spread ID:', spreadId);

    // Encode selected cards in URL and navigate to result page
    const cardIds = selectedCards.map(sc => sc.cardId).join('-');
    const reversed = selectedCards.map(sc => sc.reversed ? '1' : '0').join('');

    const url = `/result?spread=${spreadId}&cards=${cardIds}&reversed=${reversed}`;
    console.log('Navigating to:', url);

    window.location.href = url;
  };

  return <CardDeck cardCount={cardCount} onCardsSelected={handleCardsSelected} />;
}
