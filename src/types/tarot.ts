/**
 * TypeScript type definitions for Tarot card data
 */

export interface CardMeaning {
  short: string;
  detailed: string;
  general: string;
  work: string | null;
  love: string | null;
  health: string | null;
  spirituality: string | null;
}

export interface CardRelationships {
  supporting_cards: string[];
  challenging_cards: string[];
}

export interface TarotCard {
  id: number;
  name: string;
  slug: string;
  arcana: 'major' | 'minor';
  suit: 'wands' | 'cups' | 'swords' | 'pentacles' | null;
  number: number | null;
  keywords: string[];
  upright: CardMeaning;
  reversed: CardMeaning;
  description: string;
  image: string;
  relationships: CardRelationships;
}

export interface SpreadPosition {
  position: number;
  name: string;
  description: string;
}

export interface TarotSpread {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  positions: SpreadPosition[];
}

export interface DrawnCard {
  card: TarotCard;
  position: number;
  reversed: boolean;
}

export interface Reading {
  id: string;
  timestamp: number;
  spreadId: string;
  cards: DrawnCard[];
}
