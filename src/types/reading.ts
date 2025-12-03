/**
 * TypeScript type definitions for Full Reading feature
 * Analyzes card combinations and generates cohesive narratives
 */

import type { TarotCard, DrawnCard } from './tarot';

/**
 * Types of relationships between cards
 */
export type RelationshipType =
  | 'supporting'      // Cards enhance each other
  | 'challenging'     // Cards create tension
  | 'neutral'         // No strong relationship
  | 'complementary'   // Cards reinforce similar themes
  | 'contradicting';  // Cards oppose each other

/**
 * Overall energy of a reading
 */
export type OverallEnergy = 'positive' | 'negative' | 'neutral' | 'mixed';

/**
 * Interaction between two cards in a reading
 */
export interface CardInteraction {
  card1: TarotCard;
  card2: TarotCard;
  relationshipType: RelationshipType;
  strength: number; // 0-1, how strongly they interact
  interpretation?: string;
}

/**
 * Overall theme and energy analysis of a reading
 */
export interface ReadingTheme {
  primaryTheme: string;
  secondaryThemes: string[];
  overallEnergy: OverallEnergy;
  dominantSuit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  majorArcanaCount: number;
  courtCardCount: number;
}

/**
 * Complete synthesis narrative
 */
export interface ReadingSynthesis {
  opening: string;        // Introduction acknowledging the question
  body: string[];         // Main interpretation paragraphs
  conclusion: string;     // Summary and final thoughts
  advice: string;         // Actionable guidance
}

/**
 * Complete full reading analysis
 */
export interface FullReadingAnalysis {
  theme: ReadingTheme;
  interactions: CardInteraction[];
  supportingCards: DrawnCard[];
  challengingCards: DrawnCard[];
  outcomeInfluencers: DrawnCard[];
  synthesis: ReadingSynthesis;
}
