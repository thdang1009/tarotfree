/**
 * LocalStorage utilities for reading history and limits
 */

export interface Reading {
  id: string;
  timestamp: number;
  spreadId: string;
  cards: Array<{
    cardId: number;
    reversed: boolean;
  }>;
}

export interface ReadingLimitData {
  readings: number[];
  limit: number;
}

const READING_LIMIT = 5; // Allow 5 readings per 24 hours
const RESET_HOURS = 24;

/**
 * Check if user can do a reading based on limit
 */
export function canDoReading(): { allowed: boolean; hoursLeft?: number } {
  if (typeof localStorage === 'undefined') {
    return { allowed: true };
  }

  try {
    const data: ReadingLimitData = JSON.parse(
      localStorage.getItem('readingLimit') || '{"readings":[]}'
    );
    const now = Date.now();
    const cutoff = now - RESET_HOURS * 60 * 60 * 1000;

    // Remove old readings
    data.readings = data.readings.filter((ts) => ts > cutoff);

    if (data.readings.length >= READING_LIMIT) {
      const oldestReading = Math.min(...data.readings);
      const resetTime = oldestReading + RESET_HOURS * 60 * 60 * 1000;
      const hoursLeft = Math.ceil((resetTime - now) / (60 * 60 * 1000));
      return { allowed: false, hoursLeft };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking reading limit:', error);
    return { allowed: true };
  }
}

/**
 * Record a new reading
 */
export function recordReading(): void {
  if (typeof localStorage === 'undefined') return;

  try {
    const data: ReadingLimitData = JSON.parse(
      localStorage.getItem('readingLimit') || '{"readings":[]}'
    );
    data.readings.push(Date.now());
    localStorage.setItem('readingLimit', JSON.stringify(data));
  } catch (error) {
    console.error('Error recording reading:', error);
  }
}

/**
 * Save a reading to history
 */
export function saveReading(reading: Reading): void {
  if (typeof localStorage === 'undefined') return;

  try {
    const history: Reading[] = JSON.parse(
      localStorage.getItem('readingHistory') || '[]'
    );
    history.unshift(reading); // Add to beginning
    // Keep only last 10 readings
    const trimmed = history.slice(0, 10);
    localStorage.setItem('readingHistory', JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving reading:', error);
  }
}

/**
 * Get reading history
 */
export function getReadingHistory(): Reading[] {
  if (typeof localStorage === 'undefined') return [];

  try {
    return JSON.parse(localStorage.getItem('readingHistory') || '[]');
  } catch (error) {
    console.error('Error getting reading history:', error);
    return [];
  }
}

/**
 * Get remaining readings count
 */
export function getRemainingReadings(): number {
  if (typeof localStorage === 'undefined') return READING_LIMIT;

  try {
    const data: ReadingLimitData = JSON.parse(
      localStorage.getItem('readingLimit') || '{"readings":[]}'
    );
    const now = Date.now();
    const cutoff = now - RESET_HOURS * 60 * 60 * 1000;
    const recentReadings = data.readings.filter((ts) => ts > cutoff);
    return Math.max(0, READING_LIMIT - recentReadings.length);
  } catch (error) {
    console.error('Error getting remaining readings:', error);
    return READING_LIMIT;
  }
}
