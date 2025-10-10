/**
 * Cryptographically secure random number generation
 * Uses crypto.getRandomValues() instead of Math.random()
 */

/**
 * Shuffle an array using Fisher-Yates algorithm with crypto random
 */
export function shuffleDeck<T>(array: T[]): T[] {
  const shuffled = [...array];
  const randomValues = new Uint32Array(shuffled.length);
  crypto.getRandomValues(randomValues);

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Randomly determine if a card should be reversed (50/50 chance)
 */
export function isReversed(): boolean {
  const randomValue = new Uint8Array(1);
  crypto.getRandomValues(randomValue);
  return randomValue[0] > 127;
}

/**
 * Get a random integer between min (inclusive) and max (exclusive)
 */
export function getRandomInt(min: number, max: number): number {
  const range = max - min;
  const randomValue = new Uint32Array(1);
  crypto.getRandomValues(randomValue);
  return min + (randomValue[0] % range);
}

/**
 * Select N random cards from the deck
 */
export function drawCards<T>(deck: T[], count: number): T[] {
  const shuffled = shuffleDeck(deck);
  return shuffled.slice(0, count);
}
