/**
 * Reading Analyzer Engine
 * Analyzes card combinations and generates cohesive narratives for Full Reading
 */

import type { DrawnCard, TarotCard, TarotSpread } from '../types/tarot';
import type {
  CardInteraction,
  ReadingTheme,
  FullReadingAnalysis,
  RelationshipType,
  OverallEnergy
} from '../types/reading';
import { i18n } from './i18n';
import type { SupportedLanguage } from '../types/i18n';

export class ReadingAnalyzer {
  private cards: DrawnCard[];
  private spread: TarotSpread;
  private question: string;
  private language: SupportedLanguage;

  constructor(cards: DrawnCard[], spread: TarotSpread, question: string) {
    this.cards = cards;
    this.spread = spread;
    this.question = question;
    this.language = i18n.getCurrentLanguage();
  }

  /**
   * Main analysis method - generates complete full reading
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
   * Analyze overall theme and energy of the reading
   */
  private analyzeTheme(): ReadingTheme {
    // Count suits
    const suits = this.cards
      .map(dc => dc.card.suit)
      .filter(s => s !== null) as string[];

    const suitCounts = suits.reduce((acc, suit) => {
      acc[suit] = (acc[suit] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantSuit = Object.entries(suitCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] as any;

    // Count major arcana and court cards
    const majorArcanaCount = this.cards.filter(dc => dc.card.arcana === 'major').length;
    const courtCardCount = this.cards.filter(dc =>
      dc.card.name.includes('King') ||
      dc.card.name.includes('Queen') ||
      dc.card.name.includes('Knight') ||
      dc.card.name.includes('Page')
    ).length;

    // Calculate overall energy
    const overallEnergy = this.calculateOverallEnergy();

    return {
      primaryTheme: this.determinePrimaryTheme(dominantSuit, majorArcanaCount),
      secondaryThemes: this.determineSecondaryThemes(),
      overallEnergy,
      dominantSuit,
      majorArcanaCount,
      courtCardCount
    };
  }

  /**
   * Calculate overall energy of the reading
   */
  private calculateOverallEnergy(): OverallEnergy {
    const positiveKeywords = ['success', 'love', 'growth', 'abundance', 'joy', 'happiness', 'hope', 'harmony', 'peace'];
    const negativeKeywords = ['conflict', 'loss', 'fear', 'sorrow', 'struggle', 'pain', 'difficulty', 'challenge'];

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

    if (positiveScore > negativeScore * 1.5) return 'positive';
    if (negativeScore > positiveScore * 1.5) return 'negative';
    if (Math.abs(positiveScore - negativeScore) < 2) return 'mixed';
    return 'neutral';
  }

  /**
   * Determine primary theme based on dominant suit and major arcana presence
   */
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

    // If more than 60% major arcana, it's a significant reading
    if (majorCount >= this.cards.length * 0.6) {
      return templates.majorHeavy;
    }

    return templates[dominantSuit as keyof typeof templates] ||
           (this.language === 'en' ? 'A balanced reading across all areas' : 'Một bài xem cân bằng trên tất cả các khía cạnh');
  }

  /**
   * Determine secondary themes based on card patterns
   */
  private determineSecondaryThemes(): string[] {
    const themes: string[] = [];

    // Check for love/relationship cards
    const hasLoveCards = this.cards.some(dc =>
      dc.card.name.includes('Lovers') ||
      dc.card.suit === 'cups'
    );

    // Check for work/career cards
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

  /**
   * Helper to check if a card name matches another card (language-agnostic)
   * Extracts English name from Vietnamese format like "Chàng Khờ (The Fool)" -> "The Fool"
   */
  private matchesCardName(cardToMatch: TarotCard, nameToFind: string): boolean {
    // Direct match
    if (cardToMatch.name === nameToFind) return true;

    // Extract English name from Vietnamese format: "Vietnamese (English)"
    const match = cardToMatch.name.match(/\(([^)]+)\)$/);
    if (match && match[1] === nameToFind) return true;

    // Check if Vietnamese name contains the English name
    if (cardToMatch.name.includes(nameToFind)) return true;

    return false;
  }

  /**
   * Helper to check if card is in relationship list (language-agnostic)
   */
  private isInRelationshipList(card: TarotCard, relationshipList: string[]): boolean {
    return relationshipList.some(name => this.matchesCardName(card, name));
  }

  /**
   * Calculate interaction between two cards
   */
  private calculateInteraction(dc1: DrawnCard, dc2: DrawnCard): CardInteraction {
    const card1 = dc1.card;
    const card2 = dc2.card;

    let relationshipType: RelationshipType = 'neutral';
    let strength = 0;

    // Check if cards are in each other's relationship lists (language-agnostic matching)
    if (this.isInRelationshipList(card2, card1.relationships.supporting_cards)) {
      relationshipType = 'supporting';
      strength = 0.9;
    } else if (this.isInRelationshipList(card2, card1.relationships.challenging_cards)) {
      relationshipType = 'challenging';
      strength = 0.9;
    } else if (this.isInRelationshipList(card1, card2.relationships.supporting_cards)) {
      relationshipType = 'supporting';
      strength = 0.9;
    } else if (this.isInRelationshipList(card1, card2.relationships.challenging_cards)) {
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

  /**
   * Check if two cards have similar energy/themes
   */
  private haveSimilarEnergy(card1: TarotCard, card2: TarotCard): boolean {
    const keywords1 = card1.keywords.join(' ').toLowerCase();
    const keywords2 = card2.keywords.join(' ').toLowerCase();

    // Simple keyword overlap check
    const words1 = keywords1.split(' ');
    const words2 = keywords2.split(' ');
    const overlap = words1.filter(w => words2.includes(w)).length;

    return overlap >= 2;
  }

  /**
   * Get interpretation text for card interaction
   */
  private getInteractionInterpretation(
    card1: TarotCard,
    card2: TarotCard,
    type: RelationshipType
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
   * Categorize cards as supporting or challenging
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
   * Generate the full reading synthesis narrative
   */
  private generateSynthesis(
    theme: ReadingTheme,
    interactions: CardInteraction[],
    supporting: DrawnCard[],
    challenging: DrawnCard[]
  ): FullReadingAnalysis['synthesis'] {
    return {
      opening: this.generateOpening(theme),
      body: this.generateBody(theme, interactions, supporting, challenging),
      conclusion: this.generateConclusion(theme),
      advice: this.generateAdvice(theme, supporting, challenging)
    };
  }

  /**
   * Generate opening paragraph
   */
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

  /**
   * Generate body paragraphs
   */
  private generateBody(
    theme: ReadingTheme,
    interactions: CardInteraction[],
    supporting: DrawnCard[],
    challenging: DrawnCard[]
  ): string[] {
    const paragraphs: string[] = [];

    // Paragraph 1: Suit dominance
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

      paragraphs.push(suitMeanings[theme.dominantSuit]);
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
        const supportingNames = supporting.map(dc => dc.card.name).slice(0, 2).join(', ');
        dynamicText = this.language === 'en'
          ? `The cards show strong supportive energies working in your favor. ${supportingNames}${supporting.length > 2 ? ' and others' : ''} create a positive foundation, helping you move forward with confidence.`
          : `Các lá bài cho thấy năng lượng hỗ trợ mạnh mẽ đang hoạt động có lợi cho bạn. ${supportingNames}${supporting.length > 2 ? ' và những lá khác' : ''} tạo ra một nền tảng tích cực, giúp bạn tiến lên với sự tự tin.`;
      } else if (challenging.length > supporting.length) {
        const challengingNames = challenging.map(dc => dc.card.name).slice(0, 2).join(', ');
        dynamicText = this.language === 'en'
          ? `The reading reveals some challenging dynamics. ${challengingNames}${challenging.length > 2 ? ' and others' : ''} highlight areas of resistance or lessons to be learned. These are not obstacles but teachers.`
          : `Bài xem tiết lộ một số động lực thách thức. ${challengingNames}${challenging.length > 2 ? ' và những lá khác' : ''} làm nổi bật các khu vực kháng cự hoặc bài học cần được học. Đây không phải là chướng ngại vật mà là giáo viên.`;
      } else {
        dynamicText = this.language === 'en'
          ? `The reading shows a balance between supportive and challenging energies, creating a dynamic tension that invites growth through both ease and effort.`
          : `Bài xem cho thấy sự cân bằng giữa năng lượng hỗ trợ và thách thức, tạo ra một căng thẳng năng động mời gọi sự phát triển thông qua cả sự dễ dàng và nỗ lực.`;
      }

      paragraphs.push(dynamicText);
    }

    // Paragraph 4: Key interaction
    if (interactions.length > 0) {
      const topInteraction = interactions[0];
      const interactionText = this.language === 'en'
        ? `A particularly notable connection appears between ${topInteraction.card1.name} and ${topInteraction.card2.name}. ${topInteraction.interpretation}`
        : `Một kết nối đặc biệt đáng chú ý xuất hiện giữa ${topInteraction.card1.name} và ${topInteraction.card2.name}. ${topInteraction.interpretation}`;

      paragraphs.push(interactionText);
    }

    return paragraphs;
  }

  /**
   * Generate conclusion paragraph
   */
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

  /**
   * Generate advice paragraph
   */
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

/**
 * Convenience function to analyze a reading
 */
export function analyzeReading(
  cards: DrawnCard[],
  spread: TarotSpread,
  question: string = ''
): FullReadingAnalysis {
  const analyzer = new ReadingAnalyzer(cards, spread, question);
  return analyzer.analyze();
}
