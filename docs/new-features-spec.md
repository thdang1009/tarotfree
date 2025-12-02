# New Features Specification: Multi-language, Full Reading, and Text-to-Speech

**Date:** December 2, 2025
**Status:** Planning Phase
**Project:** TarotFree Enhancement

---

## Table of Contents
1. [Overview](#overview)
2. [Feature 1: Multi-language Support](#feature-1-multi-language-support)
3. [Feature 2: Full Reading (Combined Card Interpretation)](#feature-2-full-reading-combined-card-interpretation)
4. [Feature 3: Text-to-Speech (Mystery Voice)](#feature-3-text-to-speech-mystery-voice)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Technical Dependencies](#technical-dependencies)

---

## Overview

This document outlines three major enhancements to TarotFree:

1. **Multi-language Support**: Add Vietnamese translations alongside existing English
2. **Full Reading**: Synthesize all drawn cards into a cohesive narrative with card relationships
3. **Text-to-Speech**: Mystery voice reading of the full interpretation

All features are designed to work together while maintaining the backendless, privacy-first architecture.

---

## Feature 1: Multi-language Support

### Goal
Add Vietnamese language support while maintaining English, allowing users to seamlessly switch between languages.

### Architecture

#### 1.1 Language Detection & Selection

```typescript
// src/types/i18n.ts
export type SupportedLanguage = 'en' | 'vi';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' }
];
```

**Storage Strategy:**
- Store language preference in localStorage
- Default to browser language if supported, otherwise default to English
- Persist across sessions
- URL parameter support: `?lang=vi` or `?lang=en`

#### 1.2 Translation Structure

**Option A: Separate JSON Files (Recommended)**
```
src/
├── i18n/
│   ├── en/
│   │   ├── common.json        # UI labels, buttons, navigation
│   │   ├── cards.json         # Card names, keywords, meanings
│   │   ├── spreads.json       # Spread names, descriptions, positions
│   │   └── readings.json      # Reading-related text, full reading templates
│   └── vi/
│       ├── common.json
│       ├── cards.json
│       ├── spreads.json
│       └── readings.json
```

**Option B: Nested in Existing Files**
```json
// src/data/cards.json (modified structure)
{
  "id": 0,
  "name": {
    "en": "The Fool",
    "vi": "Kẻ Ngốc"
  },
  "slug": "the-fool",
  "keywords": {
    "en": ["New beginnings", "innocence", "free spirit"],
    "vi": ["Khởi đầu mới", "ngây thơ", "tinh thần tự do"]
  },
  "upright": {
    "en": {
      "short": "A fresh start, adventure, optimism...",
      "detailed": "..."
    },
    "vi": {
      "short": "Một khởi đầu mới, phiêu lưu, lạc quan...",
      "detailed": "..."
    }
  }
}
```

**Recommendation:** Use **Option A** for better separation of concerns and easier translation management.

#### 1.3 Translation Helper Utilities

```typescript
// src/utils/i18n.ts
import { SupportedLanguage } from '../types/i18n';

export class I18nManager {
  private currentLanguage: SupportedLanguage;
  private translations: Map<string, any>;

  constructor() {
    this.currentLanguage = this.detectLanguage();
    this.translations = new Map();
  }

  private detectLanguage(): SupportedLanguage {
    // 1. Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang === 'en' || urlLang === 'vi') return urlLang;

    // 2. Check localStorage
    const storedLang = localStorage.getItem('tarot-language');
    if (storedLang === 'en' || storedLang === 'vi') return storedLang;

    // 3. Check browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('vi')) return 'vi';

    // 4. Default to English
    return 'en';
  }

  async loadTranslations(namespace: string): Promise<void> {
    const lang = this.currentLanguage;
    const key = `${lang}-${namespace}`;

    if (!this.translations.has(key)) {
      const translations = await import(`../i18n/${lang}/${namespace}.json`);
      this.translations.set(key, translations.default);
    }
  }

  t(namespace: string, key: string, params?: Record<string, any>): string {
    const translations = this.translations.get(`${this.currentLanguage}-${namespace}`);
    if (!translations) return key;

    let text = this.getNestedValue(translations, key) || key;

    // Replace parameters: "Hello {name}" with params.name
    if (params) {
      Object.keys(params).forEach(paramKey => {
        text = text.replace(`{${paramKey}}`, params[paramKey]);
      });
    }

    return text;
  }

  setLanguage(lang: SupportedLanguage): void {
    this.currentLanguage = lang;
    localStorage.setItem('tarot-language', lang);
    // Reload translations or trigger re-render
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }
}

// Singleton instance
export const i18n = new I18nManager();
```

#### 1.4 UI Components

**Language Switcher Component**
```tsx
// src/components/LanguageSwitcher.tsx
import { useState, useEffect } from 'react';
import { i18n } from '../utils/i18n';
import { LANGUAGES, SupportedLanguage } from '../types/i18n';

export default function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(
    i18n.getCurrentLanguage()
  );

  const handleLanguageChange = (lang: SupportedLanguage) => {
    i18n.setLanguage(lang);
    setCurrentLang(lang);
    // Reload page to apply new language
    window.location.reload();
  };

  return (
    <div className="flex gap-2">
      {LANGUAGES.map(lang => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`
            px-3 py-1 rounded-lg transition-all
            ${currentLang === lang.code
              ? 'bg-violet-deep text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }
          `}
        >
          <span className="mr-1">{lang.flag}</span>
          {lang.nativeName}
        </button>
      ))}
    </div>
  );
}
```

**Integration in Layout**
```astro
---
// src/layouts/Layout.astro
import LanguageSwitcher from '../components/LanguageSwitcher';
---
<header>
  <nav>
    <!-- Existing navigation -->
    <LanguageSwitcher client:load />
  </nav>
</header>
```

#### 1.5 Translation Files Structure

**Example: src/i18n/en/common.json**
```json
{
  "nav": {
    "home": "Home",
    "readings": "Readings",
    "cards": "Card Library",
    "about": "About"
  },
  "buttons": {
    "shuffle": "Shuffle",
    "select": "Select Cards",
    "viewReading": "View Reading",
    "newReading": "New Reading",
    "share": "Share",
    "export": "Export as Image"
  },
  "labels": {
    "question": "Your Question",
    "questionPlaceholder": "What guidance do you seek?",
    "selectSpread": "Choose a Spread",
    "cardCount": "{count} cards",
    "progress": "Selected {current} of {total} cards"
  }
}
```

**Example: src/i18n/vi/common.json**
```json
{
  "nav": {
    "home": "Trang Chủ",
    "readings": "Xem Bài",
    "cards": "Thư Viện Bài",
    "about": "Giới Thiệu"
  },
  "buttons": {
    "shuffle": "Xáo Bài",
    "select": "Chọn Lá Bài",
    "viewReading": "Xem Kết Quả",
    "newReading": "Bài Mới",
    "share": "Chia Sẻ",
    "export": "Xuất Hình Ảnh"
  },
  "labels": {
    "question": "Câu Hỏi Của Bạn",
    "questionPlaceholder": "Bạn cần lời khuyên gì?",
    "selectSpread": "Chọn Cách Xếp Bài",
    "cardCount": "{count} lá bài",
    "progress": "Đã chọn {current} trong {total} lá"
  }
}
```

#### 1.6 Implementation Considerations

**Challenges:**
1. **Card Meanings Translation**: 78 cards × 2 languages × multiple interpretations = significant translation work
2. **Cultural Nuances**: Tarot interpretation may differ culturally between English and Vietnamese contexts
3. **Typography**: Vietnamese uses diacritics that need proper font support
4. **Text Length Variations**: Vietnamese text may be longer/shorter than English, affecting UI layout

**Solutions:**
1. Start with UI translations first, then tackle card meanings incrementally
2. Consult Vietnamese tarot readers for culturally appropriate translations
3. Use web fonts that support Vietnamese characters (e.g., Inter, Noto Sans)
4. Test all UI components with both languages to ensure layout flexibility

**Migration Path:**
1. Phase 1: UI labels and navigation (quick win)
2. Phase 2: Spread descriptions and positions
3. Phase 3: Card meanings (major arcana first, then minor)
4. Phase 4: Full reading templates (feature 2 integration)

---

## Feature 2: Full Reading (Combined Card Interpretation)

### Goal
Generate a cohesive narrative that synthesizes all drawn cards, considering their relationships, positions, and the user's question.

### Architecture

This is the most complex feature. It requires understanding card relationships and generating meaningful synthesis.

#### 2.1 Card Relationship Analysis

**Current Data** (already exists in cards.json):
```json
"relationships": {
  "supporting_cards": ["Ace of Wands", "The Sun", "Temperance"],
  "challenging_cards": ["The Devil", "The Hanged Man", "Four of Swords"]
}
```

**Enhanced Relationship Model:**
```typescript
// src/types/reading.ts
export interface CardInteraction {
  card1: TarotCard;
  card2: TarotCard;
  relationshipType: 'supporting' | 'challenging' | 'neutral' | 'complementary' | 'contradicting';
  strength: number; // 0-1, how strongly they interact
  interpretation?: string;
}

export interface ReadingTheme {
  primaryTheme: string;
  secondaryThemes: string[];
  overallEnergy: 'positive' | 'negative' | 'neutral' | 'mixed';
  dominantSuit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  majorArcanaCount: number;
  courtCardCount: number;
}

export interface FullReadingAnalysis {
  theme: ReadingTheme;
  interactions: CardInteraction[];
  supportingCards: DrawnCard[];
  challengingCards: DrawnCard[];
  outcomeInfluencers: DrawnCard[];
  synthesis: {
    opening: string;
    body: string[];
    conclusion: string;
    advice: string;
  };
}
```

#### 2.2 Reading Analysis Engine

```typescript
// src/utils/readingAnalyzer.ts
import type { DrawnCard, TarotCard, TarotSpread } from '../types/tarot';
import type { CardInteraction, ReadingTheme, FullReadingAnalysis } from '../types/reading';
import { i18n } from './i18n';

export class ReadingAnalyzer {
  private cards: DrawnCard[];
  private spread: TarotSpread;
  private question: string;
  private language: 'en' | 'vi';

  constructor(cards: DrawnCard[], spread: TarotSpread, question: string) {
    this.cards = cards;
    this.spread = spread;
    this.question = question;
    this.language = i18n.getCurrentLanguage();
  }

  /**
   * Main analysis method
   */
  analyze(): FullReadingAnalysis {
    const theme = this.analyzeTheme();
    const interactions = this.analyzeInteractions();
    const { supporting, challenging } = this.categorizeCards(interactions);
    const outcomeInfluencers = this.identifyOutcomeInfluencers();
    const synthesis = this.generateSynthesis(theme, interactions, supporting, challenging);

    return {
      theme,
      interactions,
      supportingCards: supporting,
      challengingCards: challenging,
      outcomeInfluencers,
      synthesis
    };
  }

  /**
   * Analyze overall theme and energy
   */
  private analyzeTheme(): ReadingTheme {
    const suits = this.cards
      .map(dc => dc.card.suit)
      .filter(s => s !== null) as string[];

    const suitCounts = suits.reduce((acc, suit) => {
      acc[suit] = (acc[suit] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantSuit = Object.entries(suitCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] as any;

    const majorArcanaCount = this.cards.filter(dc => dc.card.arcana === 'major').length;
    const courtCardCount = this.cards.filter(dc =>
      dc.card.name.includes('King') ||
      dc.card.name.includes('Queen') ||
      dc.card.name.includes('Knight') ||
      dc.card.name.includes('Page')
    ).length;

    // Calculate overall energy
    const positiveKeywords = ['success', 'love', 'growth', 'abundance', 'joy'];
    const negativeKeywords = ['conflict', 'loss', 'fear', 'sorrow', 'struggle'];

    let positiveScore = 0;
    let negativeScore = 0;

    this.cards.forEach(dc => {
      const keywords = dc.reversed
        ? dc.card.reversed.short.toLowerCase()
        : dc.card.upright.short.toLowerCase();

      positiveKeywords.forEach(kw => {
        if (keywords.includes(kw)) positiveScore++;
      });
      negativeKeywords.forEach(kw => {
        if (keywords.includes(kw)) negativeScore++;
      });
    });

    let overallEnergy: ReadingTheme['overallEnergy'];
    if (positiveScore > negativeScore * 1.5) overallEnergy = 'positive';
    else if (negativeScore > positiveScore * 1.5) overallEnergy = 'negative';
    else if (Math.abs(positiveScore - negativeScore) < 2) overallEnergy = 'mixed';
    else overallEnergy = 'neutral';

    return {
      primaryTheme: this.determinePrimaryTheme(dominantSuit, majorArcanaCount),
      secondaryThemes: this.determineSecondaryThemes(),
      overallEnergy,
      dominantSuit,
      majorArcanaCount,
      courtCardCount
    };
  }

  private determinePrimaryTheme(dominantSuit: string | undefined, majorCount: number): string {
    const templates = this.language === 'en'
      ? {
          wands: 'Action, passion, and creative energy',
          cups: 'Emotions, relationships, and intuition',
          swords: 'Thoughts, challenges, and mental clarity',
          pentacles: 'Material world, finances, and practical matters',
          majorHeavy: 'Significant life changes and spiritual lessons'
        }
      : {
          wands: 'Hành động, đam mê và năng lượng sáng tạo',
          cups: 'Cảm xúc, các mối quan hệ và trực giác',
          swords: 'Suy nghĩ, thách thức và sự rõ ràng tinh thần',
          pentacles: 'Thế giới vật chất, tài chính và các vấn đề thực tế',
          majorHeavy: 'Những thay đổi lớn trong cuộc sống và bài học tâm linh'
        };

    if (majorCount >= this.cards.length * 0.6) {
      return templates.majorHeavy;
    }

    return templates[dominantSuit as keyof typeof templates] ||
           (this.language === 'en' ? 'A balanced reading across all areas' : 'Một bài xem cân bằng trên tất cả các khía cạnh');
  }

  private determineSecondaryThemes(): string[] {
    const themes: string[] = [];

    // Check for specific card combinations
    const hasLoveCards = this.cards.some(dc =>
      dc.card.name.includes('Lovers') ||
      dc.card.suit === 'cups'
    );

    const hasWorkCards = this.cards.some(dc =>
      dc.card.suit === 'pentacles' ||
      dc.card.name.includes('Chariot') ||
      dc.card.name.includes('Emperor')
    );

    if (hasLoveCards) themes.push(this.language === 'en' ? 'Relationships' : 'Các mối quan hệ');
    if (hasWorkCards) themes.push(this.language === 'en' ? 'Career & Success' : 'Sự nghiệp & Thành công');

    return themes;
  }

  /**
   * Analyze card-to-card interactions
   */
  private analyzeInteractions(): CardInteraction[] {
    const interactions: CardInteraction[] = [];

    // Compare each card with every other card
    for (let i = 0; i < this.cards.length; i++) {
      for (let j = i + 1; j < this.cards.length; j++) {
        const card1 = this.cards[i];
        const card2 = this.cards[j];

        const interaction = this.calculateInteraction(card1, card2);
        if (interaction.strength > 0.3) { // Only include significant interactions
          interactions.push(interaction);
        }
      }
    }

    return interactions.sort((a, b) => b.strength - a.strength);
  }

  private calculateInteraction(dc1: DrawnCard, dc2: DrawnCard): CardInteraction {
    const card1 = dc1.card;
    const card2 = dc2.card;

    let relationshipType: CardInteraction['relationshipType'] = 'neutral';
    let strength = 0;

    // Check if cards are in each other's relationship lists
    if (card1.relationships.supporting_cards.includes(card2.name)) {
      relationshipType = 'supporting';
      strength = 0.9;
    } else if (card1.relationships.challenging_cards.includes(card2.name)) {
      relationshipType = 'challenging';
      strength = 0.9;
    } else if (card2.relationships.supporting_cards.includes(card1.name)) {
      relationshipType = 'supporting';
      strength = 0.9;
    } else if (card2.relationships.challenging_cards.includes(card1.name)) {
      relationshipType = 'challenging';
      strength = 0.9;
    }

    // Same suit = complementary
    if (card1.suit === card2.suit && card1.suit !== null) {
      relationshipType = relationshipType === 'neutral' ? 'complementary' : relationshipType;
      strength = Math.max(strength, 0.5);
    }

    // Both major arcana = strong interaction
    if (card1.arcana === 'major' && card2.arcana === 'major') {
      strength = Math.max(strength, 0.6);
    }

    // Reversed + upright of same energy = contradicting
    if (dc1.reversed !== dc2.reversed && this.haveSimilarEnergy(card1, card2)) {
      relationshipType = 'contradicting';
      strength = 0.7;
    }

    return {
      card1,
      card2,
      relationshipType,
      strength,
      interpretation: this.getInteractionInterpretation(card1, card2, relationshipType)
    };
  }

  private haveSimilarEnergy(card1: TarotCard, card2: TarotCard): boolean {
    const keywords1 = card1.keywords.join(' ').toLowerCase();
    const keywords2 = card2.keywords.join(' ').toLowerCase();

    // Simple keyword overlap check
    const words1 = keywords1.split(' ');
    const words2 = keywords2.split(' ');
    const overlap = words1.filter(w => words2.includes(w)).length;

    return overlap >= 2;
  }

  private getInteractionInterpretation(
    card1: TarotCard,
    card2: TarotCard,
    type: CardInteraction['relationshipType']
  ): string {
    const templates = this.language === 'en'
      ? {
          supporting: `${card1.name} enhances the energy of ${card2.name}, creating a harmonious flow.`,
          challenging: `${card1.name} creates tension with ${card2.name}, highlighting an area requiring attention.`,
          complementary: `${card1.name} and ${card2.name} work together, reinforcing similar themes.`,
          contradicting: `${card1.name} contradicts ${card2.name}, suggesting internal conflict or choices.`,
          neutral: `${card1.name} and ${card2.name} coexist, each contributing their unique perspective.`
        }
      : {
          supporting: `${card1.name} tăng cường năng lượng của ${card2.name}, tạo ra một luồng hài hòa.`,
          challenging: `${card1.name} tạo ra căng thẳng với ${card2.name}, làm nổi bật một khu vực cần chú ý.`,
          complementary: `${card1.name} và ${card2.name} làm việc cùng nhau, củng cố các chủ đề tương tự.`,
          contradicting: `${card1.name} mâu thuẫn với ${card2.name}, gợi ý xung đột nội tâm hoặc sự lựa chọn.`,
          neutral: `${card1.name} và ${card2.name} cùng tồn tại, mỗi cái đóng góp quan điểm độc đáo của riêng mình.`
        };

    return templates[type];
  }

  /**
   * Categorize cards as supporting or challenging the overall reading
   */
  private categorizeCards(interactions: CardInteraction[]): {
    supporting: DrawnCard[];
    challenging: DrawnCard[];
  } {
    const supportingSet = new Set<number>();
    const challengingSet = new Set<number>();

    interactions.forEach(interaction => {
      if (interaction.relationshipType === 'supporting') {
        supportingSet.add(interaction.card1.id);
        supportingSet.add(interaction.card2.id);
      } else if (interaction.relationshipType === 'challenging') {
        challengingSet.add(interaction.card1.id);
        challengingSet.add(interaction.card2.id);
      }
    });

    return {
      supporting: this.cards.filter(dc => supportingSet.has(dc.card.id)),
      challenging: this.cards.filter(dc => challengingSet.has(dc.card.id))
    };
  }

  /**
   * Identify cards that influence the outcome
   */
  private identifyOutcomeInfluencers(): DrawnCard[] {
    // Find "Future" or "Outcome" positions in the spread
    const outcomePositions = this.spread.positions.filter(p =>
      p.name.toLowerCase().includes('future') ||
      p.name.toLowerCase().includes('outcome') ||
      p.name.toLowerCase().includes('result')
    ).map(p => p.position);

    const outcomeCards = this.cards.filter(dc =>
      outcomePositions.includes(dc.position)
    );

    // If no specific outcome position, use the last card
    return outcomeCards.length > 0 ? outcomeCards : [this.cards[this.cards.length - 1]];
  }

  /**
   * Generate the full reading synthesis
   */
  private generateSynthesis(
    theme: ReadingTheme,
    interactions: CardInteraction[],
    supporting: DrawnCard[],
    challenging: DrawnCard[]
  ): FullReadingAnalysis['synthesis'] {
    const lang = this.language;

    // Opening: Introduce the reading and acknowledge the question
    const opening = this.generateOpening(theme);

    // Body: Analyze the reading in segments
    const body = this.generateBody(theme, interactions, supporting, challenging);

    // Conclusion: Summarize and provide guidance
    const conclusion = this.generateConclusion(theme);

    // Advice: Actionable guidance
    const advice = this.generateAdvice(theme, supporting, challenging);

    return { opening, body, conclusion, advice };
  }

  private generateOpening(theme: ReadingTheme): string {
    const templates = this.language === 'en'
      ? {
          positive: `The cards reveal a promising path ahead. Your reading is illuminated by ${theme.primaryTheme.toLowerCase()}, suggesting opportunities for growth and positive transformation.`,
          negative: `The cards bring a message of caution and awareness. With ${theme.primaryTheme.toLowerCase()} at the forefront, this is a time to navigate challenges with wisdom.`,
          mixed: `The cards present a nuanced picture, blending both opportunities and challenges. ${theme.primaryTheme} sets the stage for a journey of balance.`,
          neutral: `The cards offer guidance on your path forward. ${theme.primaryTheme} provides the foundation for understanding your current situation.`
        }
      : {
          positive: `Các lá bài tiết lộ một con đường đầy hứa hẹn phía trước. Bài xem của bạn được chiếu sáng bởi ${theme.primaryTheme.toLowerCase()}, gợi ý những cơ hội cho sự phát triển và chuyển đổi tích cực.`,
          negative: `Các lá bài mang đến thông điệp thận trọng và nhận thức. Với ${theme.primaryTheme.toLowerCase()} ở tiền tuyến, đây là lúc để vượt qua thử thách bằng trí tuệ.`,
          mixed: `Các lá bài trình bày một bức tranh tinh tế, pha trộn cả cơ hội và thử thách. ${theme.primaryTheme} đặt nền tảng cho một hành trình cân bằng.`,
          neutral: `Các lá bài mang lại hướng dẫn trên con đường phía trước của bạn. ${theme.primaryTheme} cung cấp nền tảng để hiểu tình huống hiện tại của bạn.`
        };

    let opening = templates[theme.overallEnergy];

    // Add question context
    if (this.question && this.question.trim()) {
      opening += this.language === 'en'
        ? ` In response to your question: "${this.question}"`
        : ` Để trả lời câu hỏi của bạn: "${this.question}"`;
    }

    return opening;
  }

  private generateBody(
    theme: ReadingTheme,
    interactions: CardInteraction[],
    supporting: DrawnCard[],
    challenging: DrawnCard[]
  ): string[] {
    const paragraphs: string[] = [];

    // Paragraph 1: Theme and dominant energy
    if (theme.dominantSuit) {
      const suitMeanings = this.language === 'en'
        ? {
            wands: 'The presence of Wands cards indicates that passion, creativity, and action are key themes. This is a time to pursue your ambitions with confidence.',
            cups: 'The dominance of Cups suggests that emotional matters, relationships, and intuition play a central role. Listen to your heart.',
            swords: 'The prevalence of Swords points to mental activity, communication, and decision-making. Clarity of thought will be your ally.',
            pentacles: 'The abundance of Pentacles highlights material concerns, career, and practical matters. Focus on building solid foundations.'
          }
        : {
            wands: 'Sự hiện diện của các lá Gậy cho thấy đam mê, sáng tạo và hành động là chủ đề chính. Đây là lúc để theo đuổi tham vọng với sự tự tin.',
            cups: 'Sự thống trị của Cốc cho thấy các vấn đề cảm xúc, các mối quan hệ và trực giác đóng vai trò trung tâm. Hãy lắng nghe trái tim bạn.',
            swords: 'Sự phổ biến của Kiếm chỉ ra hoạt động tinh thần, giao tiếp và ra quyết định. Sự rõ ràng trong suy nghĩ sẽ là đồng minh của bạn.',
            pentacles: 'Sự dồi dào của Tiền xu làm nổi bật các mối quan tâm vật chất, sự nghiệp và các vấn đề thực tế. Tập trung vào việc xây dựng nền tảng vững chắc.'
          };

      paragraphs.push(suitMeanings[theme.dominantSuit as keyof typeof suitMeanings]);
    }

    // Paragraph 2: Major Arcana significance
    if (theme.majorArcanaCount > 0) {
      const ratio = theme.majorArcanaCount / this.cards.length;

      if (ratio >= 0.5) {
        paragraphs.push(
          this.language === 'en'
            ? `With ${theme.majorArcanaCount} Major Arcana card(s), this reading carries significant weight. The universe is speaking through powerful archetypal energies, indicating that these are pivotal moments in your journey. Pay close attention to the lessons being offered.`
            : `Với ${theme.majorArcanaCount} lá Bài Lớn, bài xem này mang ý nghĩa đáng kể. Vũ trụ đang nói thông qua các năng lượng nguyên mẫu mạnh mẽ, cho thấy đây là những thời điểm quan trọng trong hành trình của bạn. Hãy chú ý kỹ đến những bài học được cung cấp.`
        );
      }
    }

    // Paragraph 3: Supporting vs Challenging dynamics
    if (supporting.length > 0 || challenging.length > 0) {
      let dynamicText = '';

      if (supporting.length > challenging.length) {
        dynamicText = this.language === 'en'
          ? `The cards show strong supportive energies working in your favor. ${supporting.map(dc => dc.card.name).join(', ')} create a positive foundation, helping you move forward with confidence.`
          : `Các lá bài cho thấy năng lượng hỗ trợ mạnh mẽ đang hoạt động có lợi cho bạn. ${supporting.map(dc => dc.card.name).join(', ')} tạo ra một nền tảng tích cực, giúp bạn tiến lên với sự tự tin.`;
      } else if (challenging.length > supporting.length) {
        dynamicText = this.language === 'en'
          ? `The reading reveals some challenging dynamics. ${challenging.map(dc => dc.card.name).join(', ')} highlight areas of resistance or lessons to be learned. These are not obstacles but teachers.`
          : `Bài xem tiết lộ một số động lực thách thức. ${challenging.map(dc => dc.card.name).join(', ')} làm nổi bật các khu vực kháng cự hoặc bài học cần được học. Đây không phải là ch장애vật mà là giáo viên.`;
      } else {
        dynamicText = this.language === 'en'
          ? `The reading shows a balance between supportive and challenging energies, creating a dynamic tension that invites growth through both ease and effort.`
          : `Bài xem cho thấy sự cân bằng giữa năng lượng hỗ trợ và thách thức, tạo ra một căng thẳng năng động mời gọi sự phát triển thông qua cả sự dễ dàng và nỗ lực.`;
      }

      paragraphs.push(dynamicText);
    }

    // Paragraph 4: Key interactions
    if (interactions.length > 0) {
      const topInteraction = interactions[0];
      const interactionText = this.language === 'en'
        ? `A particularly notable connection appears between ${topInteraction.card1.name} and ${topInteraction.card2.name}. ${topInteraction.interpretation}`
        : `Một kết nối đặc biệt đáng chú ý xuất hiện giữa ${topInteraction.card1.name} và ${topInteraction.card2.name}. ${topInteraction.interpretation}`;

      paragraphs.push(interactionText);
    }

    return paragraphs;
  }

  private generateConclusion(theme: ReadingTheme): string {
    const templates = this.language === 'en'
      ? {
          positive: 'This reading brings a message of hope and potential. Trust in the journey ahead and embrace the opportunities that come your way.',
          negative: 'While challenges are present, they bring important lessons. Face them with courage and wisdom, knowing that growth often comes through difficulty.',
          mixed: 'Your path holds both light and shadow. Navigate with awareness, accepting both the gifts and the challenges as part of your journey.',
          neutral: 'The cards have spoken, offering their wisdom. Reflect on these messages and trust your intuition to guide you forward.'
        }
      : {
          positive: 'Bài xem này mang thông điệp hy vọng và tiềm năng. Hãy tin tưởng vào hành trình phía trước và đón nhận những cơ hội đến với bạn.',
          negative: 'Mặc dù có những thử thách, chúng mang lại những bài học quan trọng. Hãy đối mặt với chúng bằng lòng can đảm và trí tuệ, biết rằng sự phát triển thường đến qua khó khăn.',
          mixed: 'Con đường của bạn chứa cả ánh sáng và bóng tối. Hãy điều hướng với nhận thức, chấp nhận cả những món quà và thử thách như một phần của hành trình.',
          neutral: 'Các lá bài đã nói, cung cấp trí tuệ của họ. Hãy suy ngẫm về những thông điệp này và tin tưởng trực giác của bạn để dẫn dắt bạn tiến lên.'
        };

    return templates[theme.overallEnergy];
  }

  private generateAdvice(
    theme: ReadingTheme,
    supporting: DrawnCard[],
    challenging: DrawnCard[]
  ): string {
    let advice = '';

    if (supporting.length > 0) {
      advice += this.language === 'en'
        ? `Draw strength from the supportive energies of ${supporting[0].card.name}. `
        : `Hãy rút sức mạnh từ năng lượng hỗ trợ của ${supporting[0].card.name}. `;
    }

    if (challenging.length > 0) {
      advice += this.language === 'en'
        ? `Be mindful of the lessons ${challenging[0].card.name} brings, and approach them with patience. `
        : `Hãy chú ý đến những bài học mà ${challenging[0].card.name} mang lại, và tiếp cận chúng với sự kiên nhẫn. `;
    }

    advice += this.language === 'en'
      ? 'Remember, the cards are a mirror—they reflect possibilities, not certainties. You hold the power to shape your path.'
      : 'Hãy nhớ, các lá bài là một tấm gương—chúng phản ánh khả năng, không phải sự chắc chắn. Bạn nắm giữ quyền lực để định hình con đường của mình.';

    return advice;
  }
}

// Usage example
export function analyzeReading(
  cards: DrawnCard[],
  spread: TarotSpread,
  question: string
): FullReadingAnalysis {
  const analyzer = new ReadingAnalyzer(cards, spread, question);
  return analyzer.analyze();
}
```

#### 2.3 UI Components for Full Reading

```tsx
// src/components/FullReadingDisplay.tsx
import { useState, useEffect } from 'react';
import type { FullReadingAnalysis } from '../types/reading';
import { analyzeReading } from '../utils/readingAnalyzer';
import type { DrawnCard, TarotSpread } from '../types/tarot';

interface FullReadingDisplayProps {
  cards: DrawnCard[];
  spread: TarotSpread;
  question: string;
}

export default function FullReadingDisplay({
  cards,
  spread,
  question
}: FullReadingDisplayProps) {
  const [analysis, setAnalysis] = useState<FullReadingAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate analysis (in reality this is instant, but we can add a delay for effect)
    setTimeout(() => {
      const result = analyzeReading(cards, spread, question);
      setAnalysis(result);
      setIsLoading(false);
    }, 1500);
  }, [cards, spread, question]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-violet-200 rounded w-3/4"></div>
        <div className="h-4 bg-violet-100 rounded w-full"></div>
        <div className="h-4 bg-violet-100 rounded w-5/6"></div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl shadow-2xl">
      {/* Header */}
      <div className="text-center border-b-2 border-violet-200 pb-6">
        <h2 className="text-4xl font-heading text-violet-deep mb-2">
          ✨ Full Reading Synthesis
        </h2>
        <p className="text-lg text-violet-medium">
          {analysis.theme.primaryTheme}
        </p>
      </div>

      {/* Opening */}
      <section className="prose prose-lg">
        <p className="text-xl leading-relaxed text-gray-800 italic">
          {analysis.synthesis.opening}
        </p>
      </section>

      {/* Theme Overview */}
      <section className="bg-white/60 rounded-lg p-6 shadow-inner">
        <h3 className="text-2xl font-heading text-violet-deep mb-4">
          🔮 Reading Overview
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="font-semibold text-violet-medium">Overall Energy:</p>
            <p className="text-lg capitalize">{analysis.theme.overallEnergy}</p>
          </div>
          <div>
            <p className="font-semibold text-violet-medium">Dominant Theme:</p>
            <p className="text-lg">{analysis.theme.primaryTheme}</p>
          </div>
          {analysis.theme.secondaryThemes.length > 0 && (
            <div className="md:col-span-2">
              <p className="font-semibold text-violet-medium">Secondary Themes:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {analysis.theme.secondaryThemes.map(theme => (
                  <span
                    key={theme}
                    className="px-3 py-1 bg-violet-100 text-violet-deep rounded-full text-sm"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Body - Main Interpretation */}
      <section>
        <h3 className="text-2xl font-heading text-violet-deep mb-4">
          📖 Interpretation
        </h3>
        <div className="space-y-4">
          {analysis.synthesis.body.map((paragraph, index) => (
            <p key={index} className="text-lg leading-relaxed text-gray-700">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {/* Card Interactions */}
      {analysis.interactions.length > 0 && (
        <section className="bg-gradient-to-r from-violet-100 to-purple-100 rounded-lg p-6">
          <h3 className="text-2xl font-heading text-violet-deep mb-4">
            🌟 Key Card Interactions
          </h3>
          <div className="space-y-3">
            {analysis.interactions.slice(0, 3).map((interaction, index) => (
              <div
                key={index}
                className="bg-white/70 rounded-lg p-4 border-l-4 border-violet-deep"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`
                    px-2 py-1 rounded text-xs font-semibold uppercase
                    ${interaction.relationshipType === 'supporting' ? 'bg-green-200 text-green-800' :
                      interaction.relationshipType === 'challenging' ? 'bg-red-200 text-red-800' :
                      interaction.relationshipType === 'complementary' ? 'bg-blue-200 text-blue-800' :
                      'bg-gray-200 text-gray-800'}
                  `}>
                    {interaction.relationshipType}
                  </span>
                  <span className="text-sm text-gray-600">
                    Strength: {Math.round(interaction.strength * 100)}%
                  </span>
                </div>
                <p className="text-gray-700">{interaction.interpretation}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Supporting & Challenging Cards */}
      <section className="grid md:grid-cols-2 gap-6">
        {analysis.supportingCards.length > 0 && (
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-xl font-heading text-green-800 mb-3">
              ✅ Supporting Energies
            </h3>
            <ul className="space-y-2">
              {analysis.supportingCards.map(dc => (
                <li key={dc.position} className="flex items-center gap-2">
                  <span className="text-green-600">●</span>
                  <span className="font-semibold">{dc.card.name}</span>
                  {dc.reversed && <span className="text-xs text-gray-600">(Reversed)</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.challengingCards.length > 0 && (
          <div className="bg-amber-50 rounded-lg p-6">
            <h3 className="text-xl font-heading text-amber-800 mb-3">
              ⚠️ Challenging Energies
            </h3>
            <ul className="space-y-2">
              {analysis.challengingCards.map(dc => (
                <li key={dc.position} className="flex items-center gap-2">
                  <span className="text-amber-600">●</span>
                  <span className="font-semibold">{dc.card.name}</span>
                  {dc.reversed && <span className="text-xs text-gray-600">(Reversed)</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Conclusion */}
      <section className="bg-violet-deep text-white rounded-lg p-6">
        <h3 className="text-2xl font-heading mb-4">🌙 Conclusion</h3>
        <p className="text-lg leading-relaxed mb-6">
          {analysis.synthesis.conclusion}
        </p>

        <div className="border-t border-violet-light pt-4">
          <h4 className="text-xl font-heading mb-2">💫 Advice</h4>
          <p className="text-lg leading-relaxed">
            {analysis.synthesis.advice}
          </p>
        </div>
      </section>
    </div>
  );
}
```

#### 2.4 Integration Considerations

**Challenges:**
1. **Complexity**: Analyzing card relationships is algorithmically complex
2. **Quality**: Automated interpretations may feel generic without AI enhancement
3. **Cultural Context**: Different tarot traditions have different relationship interpretations
4. **Performance**: Analysis must be fast (<2 seconds)

**Solutions:**
1. **Pre-computed Relationships**: Enhance cards.json with more detailed relationship data
2. **Template System**: Use rich templates with variable substitution
3. **Optional AI Enhancement**: Consider using a lightweight LLM API for more nuanced synthesis (future enhancement)
4. **Caching**: Cache analysis results by card combination hash

**Future Enhancements:**
- Integration with OpenAI/Anthropic API for AI-generated synthesis (optional, user preference)
- Community contributions for relationship interpretations
- Save and compare readings over time

---

## Feature 3: Text-to-Speech (Mystery Voice)

### Goal
Add voice narration of the full reading synthesis, with language-appropriate voices and a "mystery" aesthetic.

### Architecture

#### 3.1 Web Speech API Integration

```typescript
// src/utils/textToSpeech.ts
import type { SupportedLanguage } from '../types/i18n';

export class TextToSpeechManager {
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.loadVoices();
  }

  private loadVoices(): void {
    this.voices = this.synthesis.getVoices();

    // Chrome loads voices asynchronously
    if (this.voices.length === 0) {
      this.synthesis.addEventListener('voiceschanged', () => {
        this.voices = this.synthesis.getVoices();
      });
    }
  }

  /**
   * Select an appropriate "mystery" voice based on language
   */
  selectMysteryVoice(language: SupportedLanguage): SpeechSynthesisVoice | null {
    const languageCode = language === 'vi' ? 'vi' : 'en';

    // Filter voices by language
    const languageVoices = this.voices.filter(voice =>
      voice.lang.startsWith(languageCode)
    );

    if (languageVoices.length === 0) {
      console.warn(`No ${language} voices available`);
      return null;
    }

    // Preferences for "mystery" voices
    // Look for: lower pitch, quality names containing "whisper", "enhanced", "premium"
    const preferences = [
      // For English
      'Google UK English Female',
      'Microsoft Zira',
      'Karen',
      'Samantha',
      // For Vietnamese
      'Google tiếng Việt',
      'Microsoft An'
    ];

    // Try to find a preferred voice
    for (const pref of preferences) {
      const voice = languageVoices.find(v => v.name.includes(pref));
      if (voice) return voice;
    }

    // Prefer female voices for tarot (often perceived as more mystical)
    const femaleVoice = languageVoices.find(v =>
      v.name.toLowerCase().includes('female') ||
      v.name.includes('Zira') ||
      v.name.includes('Karen') ||
      v.name.includes('Samantha')
    );

    if (femaleVoice) return femaleVoice;

    // Default to first available voice for the language
    return languageVoices[0];
  }

  /**
   * Speak text with mystery voice settings
   */
  speak(
    text: string,
    language: SupportedLanguage,
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      onPause?: () => void;
      onError?: (error: Error) => void;
    }
  ): void {
    // Cancel any ongoing speech
    this.stop();

    const voice = this.selectMysteryVoice(language);
    if (!voice) {
      options?.onError?.(new Error('No suitable voice found'));
      return;
    }

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.voice = voice;
    this.currentUtterance.lang = language === 'vi' ? 'vi-VN' : 'en-US';

    // Mystery voice settings
    this.currentUtterance.rate = 0.85; // Slightly slower for dramatic effect
    this.currentUtterance.pitch = 0.9; // Slightly lower pitch
    this.currentUtterance.volume = 1.0; // Full volume

    // Event handlers
    this.currentUtterance.onstart = () => options?.onStart?.();
    this.currentUtterance.onend = () => options?.onEnd?.();
    this.currentUtterance.onpause = () => options?.onPause?.();
    this.currentUtterance.onerror = (event) => {
      options?.onError?.(new Error(`Speech synthesis error: ${event.error}`));
    };

    this.synthesis.speak(this.currentUtterance);
  }

  /**
   * Pause ongoing speech
   */
  pause(): void {
    if (this.synthesis.speaking) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  /**
   * Stop and cancel ongoing speech
   */
  stop(): void {
    this.synthesis.cancel();
    this.currentUtterance = null;
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  /**
   * Check if paused
   */
  isPaused(): boolean {
    return this.synthesis.paused;
  }

  /**
   * Get available voices for a language
   */
  getAvailableVoices(language: SupportedLanguage): SpeechSynthesisVoice[] {
    const languageCode = language === 'vi' ? 'vi' : 'en';
    return this.voices.filter(voice => voice.lang.startsWith(languageCode));
  }
}

// Singleton instance
export const ttsManager = new TextToSpeechManager();
```

#### 3.2 UI Component - Mystery Voice Button

```tsx
// src/components/MysteryVoiceButton.tsx
import { useState, useEffect } from 'react';
import { ttsManager } from '../utils/textToSpeech';
import { i18n } from '../utils/i18n';
import type { FullReadingAnalysis } from '../types/reading';

interface MysteryVoiceButtonProps {
  analysis: FullReadingAnalysis;
  className?: string;
}

export default function MysteryVoiceButton({
  analysis,
  className = ''
}: MysteryVoiceButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const language = i18n.getCurrentLanguage();

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      ttsManager.stop();
    };
  }, []);

  const generateFullText = (): string => {
    const { opening, body, conclusion, advice } = analysis.synthesis;

    // Combine all text with pauses
    const sections = [
      opening,
      ...body,
      conclusion,
      advice
    ];

    // Add dramatic pauses between sections
    return sections.join('... ');
  };

  const handlePlay = () => {
    if (isPaused) {
      ttsManager.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    const fullText = generateFullText();

    ttsManager.speak(fullText, language, {
      onStart: () => {
        setIsPlaying(true);
        setIsPaused(false);
        setError(null);
      },
      onEnd: () => {
        setIsPlaying(false);
        setIsPaused(false);
      },
      onPause: () => {
        setIsPaused(true);
      },
      onError: (err) => {
        setError(err.message);
        setIsPlaying(false);
        setIsPaused(false);
      }
    });
  };

  const handlePause = () => {
    ttsManager.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    ttsManager.stop();
    setIsPlaying(false);
    setIsPaused(false);
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Main Mystery Button */}
      <button
        onClick={isPlaying ? handlePause : handlePlay}
        disabled={!!error}
        className={`
          relative group
          px-8 py-4 rounded-full
          bg-gradient-to-r from-violet-deep via-purple-800 to-violet-deep
          text-white font-heading text-xl
          shadow-2xl hover:shadow-purple-500/50
          transform hover:scale-105 active:scale-95
          transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
          overflow-hidden
        `}
      >
        {/* Animated background shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>

        {/* Content */}
        <div className="relative flex items-center gap-3">
          {isPlaying ? (
            <>
              <span className="text-2xl animate-pulse">🔮</span>
              <span>{language === 'en' ? 'Pause Mystery Voice' : 'Tạm Dừng Giọng Bí Ẩn'}</span>
            </>
          ) : isPaused ? (
            <>
              <span className="text-2xl">🌙</span>
              <span>{language === 'en' ? 'Continue' : 'Tiếp Tục'}</span>
            </>
          ) : (
            <>
              <span className="text-2xl">🔮</span>
              <span>{language === 'en' ? 'Hear the Mystery Voice' : 'Nghe Giọng Bí Ẩn'}</span>
            </>
          )}
        </div>
      </button>

      {/* Control Buttons */}
      {(isPlaying || isPaused) && (
        <button
          onClick={handleStop}
          className="
            px-4 py-2 rounded-lg
            bg-red-600 hover:bg-red-700
            text-white text-sm
            transition-colors
          "
        >
          {language === 'en' ? '⏹ Stop' : '⏹ Dừng'}
        </button>
      )}

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm">
          {language === 'en'
            ? `Error: ${error}`
            : `Lỗi: ${error}`}
        </div>
      )}

      {/* Subtitle hint */}
      {!isPlaying && !error && (
        <p className="text-sm text-gray-600 italic text-center max-w-md">
          {language === 'en'
            ? 'Click to hear your reading narrated by the mystical voice. Works best with headphones. 🎧'
            : 'Nhấp để nghe bài xem của bạn được kể bởi giọng nói huyền bí. Tốt nhất với tai nghe. 🎧'}
        </p>
      )}
    </div>
  );
}
```

#### 3.3 CSS Animations

```css
/* src/styles/global.css - Add shimmer animation */
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 3s infinite;
}
```

#### 3.4 Integration into Result Page

```astro
---
// src/pages/result/[...params].astro (modification)
import FullReadingDisplay from '../../components/FullReadingDisplay';
import MysteryVoiceButton from '../../components/MysteryVoiceButton';

// ... existing code to parse cards, spread, etc.
---

<Layout title="Your Tarot Reading">
  <!-- Individual card meanings (existing) -->
  <section>
    <!-- ... existing individual card displays ... -->
  </section>

  <!-- NEW: Full Reading Section -->
  <section className="mt-16">
    <FullReadingDisplay
      cards={drawnCards}
      spread={spread}
      question={question}
      client:load
    />
  </section>

  <!-- NEW: Mystery Voice Button -->
  <section className="mt-8 text-center">
    <MysteryVoiceButton
      analysis={fullReadingAnalysis}
      client:load
    />
  </section>
</Layout>
```

#### 3.5 Browser Compatibility & Fallbacks

```typescript
// src/utils/speechSupport.ts
export function checkSpeechSynthesisSupport(): {
  supported: boolean;
  message: string;
} {
  if (!('speechSynthesis' in window)) {
    return {
      supported: false,
      message: 'Your browser does not support text-to-speech. Please try Chrome, Safari, or Edge.'
    };
  }

  // Check if voices are available
  const voices = window.speechSynthesis.getVoices();

  return {
    supported: true,
    message: `${voices.length} voices available`
  };
}
```

**Fallback Strategy:**
- Display helpful message if Web Speech API is not supported
- Provide option to download reading as PDF instead
- Consider third-party TTS services (e.g., Amazon Polly, Google Cloud TTS) for better quality (requires backend)

---

## Implementation Roadmap

### Phase 1: Multi-language Foundation (Week 1-2)
- [ ] Set up i18n directory structure
- [ ] Create translation utilities (i18n.ts)
- [ ] Implement LanguageSwitcher component
- [ ] Translate UI labels (common.json)
- [ ] Test language switching across all pages

### Phase 2: Content Translation (Week 3-4)
- [ ] Translate spread descriptions and positions
- [ ] Translate Major Arcana cards (22 cards)
- [ ] Translate Minor Arcana cards (56 cards)
- [ ] Review and refine translations with native Vietnamese speaker
- [ ] Update TypeScript types if needed

### Phase 3: Full Reading Engine (Week 5-7)
- [ ] Enhance cards.json with detailed relationship data
- [ ] Implement ReadingAnalyzer class
- [ ] Build analysis algorithms (theme, interactions, synthesis)
- [ ] Create FullReadingDisplay component
- [ ] Write synthesis templates in both languages
- [ ] Test with various spread types
- [ ] Optimize performance

### Phase 4: Text-to-Speech Integration (Week 8)
- [ ] Implement TextToSpeechManager
- [ ] Create MysteryVoiceButton component
- [ ] Design voice selection algorithm
- [ ] Add animations and effects
- [ ] Test across different browsers
- [ ] Implement fallbacks for unsupported browsers

### Phase 5: Integration & Testing (Week 9-10)
- [ ] Integrate all features into result page
- [ ] End-to-end testing
- [ ] Mobile responsiveness testing
- [ ] Performance optimization
- [ ] Accessibility audit (WCAG compliance)
- [ ] User testing and feedback

### Phase 6: Deployment & Documentation (Week 11)
- [ ] Update development-journey.md
- [ ] Create user guide for new features
- [ ] Deploy to Netlify
- [ ] Monitor analytics and user feedback
- [ ] Iterate based on feedback

---

## Technical Dependencies

### NPM Packages (Potential Additions)

```json
{
  "dependencies": {
    // Existing packages remain...

    // Optional: For better i18n (alternative to custom solution)
    "i18next": "^23.x",
    "react-i18next": "^14.x",

    // Optional: For advanced TTS (if Web Speech API insufficient)
    // "aws-sdk": "^2.x" // Amazon Polly
    // "react-speech-kit": "^3.x" // Wrapper for Web Speech API
  },
  "devDependencies": {
    // For testing translations
    "vitest": "^1.x"
  }
}
```

### Browser API Requirements

- **Web Speech API**: For text-to-speech
  - Support: Chrome 33+, Safari 7+, Edge 14+
  - Not supported: Firefox (as of 2025), IE

- **Local Storage**: For language preference (already used)

- **Crypto API**: For randomness (already used)

### Performance Considerations

1. **Bundle Size**:
   - Translation files can increase bundle size
   - Solution: Code-split by language, lazy load translations

2. **Analysis Performance**:
   - Card relationship analysis is O(n²) where n = number of cards
   - For Celtic Cross (10 cards) = 45 comparisons
   - Should complete in <100ms on modern devices

3. **TTS Loading**:
   - Voices load asynchronously
   - Must handle voice loading state

### Data Structure Changes

**Current cards.json** already has relationships:
```json
"relationships": {
  "supporting_cards": ["card1", "card2"],
  "challenging_cards": ["card3", "card4"]
}
```

**Proposed enhancement** (optional):
```json
"relationships": {
  "supporting_cards": [
    {
      "name": "The Sun",
      "interpretation": {
        "en": "The Sun amplifies The Fool's optimism...",
        "vi": "Mặt Trời khuếch đại sự lạc quan của Kẻ Ngốc..."
      }
    }
  ],
  "challenging_cards": [
    {
      "name": "The Devil",
      "interpretation": {
        "en": "The Devil warns The Fool of recklessness...",
        "vi": "Ác Quỷ cảnh báo Kẻ Ngốc về sự liều lĩnh..."
      }
    }
  ]
}
```

---

## Accessibility Considerations

### 1. Multi-language
- Proper `lang` attribute on HTML elements
- Font support for Vietnamese diacritics
- RTL support (not needed for Vietnamese/English, but good practice)

### 2. Full Reading
- Semantic HTML (headings hierarchy)
- Keyboard navigation for expandable sections
- Screen reader announcements for loading states

### 3. Text-to-Speech
- ARIA labels for play/pause/stop buttons
- Keyboard shortcuts (Space = play/pause, Esc = stop)
- Visual feedback for current speaking section
- Closed captions option (future enhancement)

---

## Security & Privacy

All features maintain the backendless, privacy-first architecture:

- **No server-side processing**: All analysis happens client-side
- **No tracking**: Language preference stored locally only
- **No data collection**: Full reading synthesis is ephemeral
- **No external API calls**: Web Speech API is browser-native
  - Exception: If using third-party TTS, make this opt-in with clear disclosure

---

## Future Enhancements (Post-MVP)

1. **AI-Enhanced Synthesis** (Optional, Opt-in):
   - Integration with OpenAI or Anthropic API
   - More nuanced, personalized interpretations
   - Requires user consent and API key

2. **Voice Customization**:
   - Let users choose from available voices
   - Pitch and rate controls
   - Download reading as audio file (MP3)

3. **More Languages**:
   - Spanish, French, Mandarin, etc.
   - Community-contributed translations

4. **Reading Journal**:
   - Save readings with notes
   - Track readings over time
   - Export as PDF/EPUB

5. **Offline Support**:
   - PWA with service worker
   - Download language packs
   - Offline TTS using local voices

---

## Conclusion

These three features represent a significant evolution of TarotFree:

1. **Multi-language** makes the app accessible to Vietnamese speakers and sets foundation for more languages
2. **Full Reading** transforms individual card meanings into a cohesive narrative, matching real tarot practice
3. **Mystery Voice** adds an immersive, mystical dimension to the reading experience

All features work together synergistically while maintaining the core principles:
- ✅ Privacy-first (backendless)
- ✅ Free and ad-free
- ✅ Fast and responsive
- ✅ Beautiful UX
- ✅ Accessible to all

The architecture is designed to be maintainable, extensible, and performant. By carefully planning before coding, we ensure a solid foundation that can grow with user needs.

---

**Next Steps**: Review this specification, discuss any concerns or modifications, then proceed to implementation following the roadmap. Let's build something magical! ✨🔮
