/**
 * Reading Analyzer Engine
 * Analyzes card combinations and generates cohesive narratives for Full Reading
 */

import type { DrawnCard, TarotCard, TarotSpread, SpreadPosition } from '../types/tarot';
import type {
  CardInteraction,
  ReadingTheme,
  FullReadingAnalysis,
  RelationshipType,
  OverallEnergy,
  StoryBeat,
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
    const storyBeats = this.generateStoryBeats(interactions);

    return {
      theme,
      interactions,
      supportingCards: supporting,
      challengingCards: challenging,
      outcomeInfluencers,
      synthesis,
      storyBeats,
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
   * Pick a deterministic variant index based on card IDs so the same reading
   * always produces the same narrative, but different readings feel fresh.
   */
  private variantIndex(count: number): number {
    const seed = this.cards.reduce((acc, dc) => acc + dc.card.id, 0);
    return seed % count;
  }

  /**
   * Generate opening paragraph — 3 variants per energy, card names woven in.
   */
  private generateOpening(theme: ReadingTheme): string {
    const firstCard = this.cards[0]?.card.name ?? '';
    const lastCard  = this.cards[this.cards.length - 1]?.card.name ?? '';
    const en = {
      positive: [
        `${firstCard} opens your reading with an air of possibility, and the energy only grows from there. The cards are aligned around ${theme.primaryTheme.toLowerCase()}—a clear sign that momentum is building in your favour.`,
        `The cards have gathered to tell a story of expansion and hope. With ${theme.primaryTheme.toLowerCase()} running through this reading like a golden thread, the universe is nudging you forward with confidence.`,
        `Something is stirring. ${firstCard} sets the tone—optimistic, ready, alive with potential. This is a reading about ${theme.primaryTheme.toLowerCase()}, and the message is clear: now is your time.`,
      ],
      negative: [
        `${firstCard} does not shy away from the truth, and neither do the rest of these cards. This reading, centred on ${theme.primaryTheme.toLowerCase()}, is asking you to slow down, pay attention, and move with intention.`,
        `The cards are holding up a mirror. What they reflect is not punishment—it is invitation. ${theme.primaryTheme} is asking you to face something you may have been avoiding.`,
        `There is weight in this reading. ${firstCard} arrives with a message that deserves your full attention. The theme of ${theme.primaryTheme.toLowerCase()} calls for honesty with yourself before you take your next step.`,
      ],
      mixed: [
        `${firstCard} and ${lastCard} frame a reading that refuses to be simple. Light and shadow are both present here—${theme.primaryTheme} is neither a promise nor a warning, but an invitation to stay awake.`,
        `The cards show a story still being written. ${theme.primaryTheme} sits at the heart of this reading, and what you do with the tensions here will shape where you end up.`,
        `This is a reading of contrasts. ${firstCard} pulls in one direction, ${lastCard} in another. ${theme.primaryTheme} is the ground you stand on while you decide which way to move.`,
      ],
      neutral: [
        `The cards have settled into a clear pattern. ${firstCard} begins a quiet story about ${theme.primaryTheme.toLowerCase()}—not dramatic, but honest and worth sitting with.`,
        `${theme.primaryTheme} colours this reading in steady, dependable tones. The cards are not calling for urgency; they are asking you to look clearly at what is already in front of you.`,
        `A thoughtful reading has emerged around you. ${firstCard} opens things gently, and the cards that follow speak to ${theme.primaryTheme.toLowerCase()} with a calm and grounded voice.`,
      ],
    };
    const vi = {
      positive: [
        `${firstCard} mở đầu bài xem với một không khí đầy khả năng, và năng lượng chỉ tăng lên từ đó. Các lá bài đang xoay quanh ${theme.primaryTheme.toLowerCase()}—dấu hiệu rõ ràng rằng đà phát triển đang hướng về phía bạn.`,
        `Các lá bài tập hợp để kể một câu chuyện về sự mở rộng và hy vọng. Với ${theme.primaryTheme.toLowerCase()} chạy xuyên suốt bài xem này như một sợi chỉ vàng, vũ trụ đang thúc đẩy bạn tiến lên với sự tự tin.`,
        `Có điều gì đó đang chuyển động. ${firstCard} đặt ra giai điệu—lạc quan, sẵn sàng, tràn đầy tiềm năng. Đây là bài xem về ${theme.primaryTheme.toLowerCase()}, và thông điệp rõ ràng: đây là thời điểm của bạn.`,
      ],
      negative: [
        `${firstCard} không né tránh sự thật, và những lá bài còn lại cũng vậy. Bài xem này, tập trung vào ${theme.primaryTheme.toLowerCase()}, đang yêu cầu bạn chậm lại, chú ý và hành động có chủ đích.`,
        `Các lá bài đang giơ lên một tấm gương. Những gì chúng phản chiếu không phải là trừng phạt—đó là lời mời. ${theme.primaryTheme} đang yêu cầu bạn đối mặt với điều gì đó có thể bạn đã tránh né.`,
        `Có sức nặng trong bài xem này. ${firstCard} đến với một thông điệp xứng đáng được chú ý đầy đủ. Chủ đề ${theme.primaryTheme.toLowerCase()} kêu gọi sự thành thật với bản thân trước khi bạn bước tiếp.`,
      ],
      mixed: [
        `${firstCard} và ${lastCard} khung một bài xem từ chối đơn giản. Ánh sáng và bóng tối đều hiện diện ở đây—${theme.primaryTheme} không phải là lời hứa cũng không phải cảnh báo, mà là lời mời hãy tỉnh thức.`,
        `Các lá bài cho thấy một câu chuyện vẫn đang được viết. ${theme.primaryTheme} nằm ở trung tâm của bài xem này, và những gì bạn làm với những căng thẳng ở đây sẽ định hình nơi bạn kết thúc.`,
        `Đây là bài xem của những tương phản. ${firstCard} kéo về một hướng, ${lastCard} về hướng khác. ${theme.primaryTheme} là nền tảng bạn đứng trong khi quyết định đi hướng nào.`,
      ],
      neutral: [
        `Các lá bài đã ổn định vào một mô hình rõ ràng. ${firstCard} bắt đầu một câu chuyện yên tĩnh về ${theme.primaryTheme.toLowerCase()}—không kịch tính, nhưng trung thực và đáng suy ngẫm.`,
        `${theme.primaryTheme} tô màu bài xem này với những nốt nhạc ổn định, đáng tin cậy. Các lá bài không kêu gọi sự khẩn cấp; chúng đang yêu cầu bạn nhìn rõ ràng vào những gì đã ở trước mặt bạn.`,
        `Một bài xem chu đáo đã nổi lên xung quanh bạn. ${firstCard} mở đầu nhẹ nhàng, và những lá bài tiếp theo nói về ${theme.primaryTheme.toLowerCase()} với giọng điệu bình tĩnh và vững chắc.`,
      ],
    };

    const pool = this.language === 'en' ? en : vi;
    const variants = pool[theme.overallEnergy];
    return variants[this.variantIndex(variants.length)];
  }

  /**
   * Generate body paragraphs — richer, card-name-aware
   */
  private generateBody(
    theme: ReadingTheme,
    interactions: CardInteraction[],
    supporting: DrawnCard[],
    challenging: DrawnCard[]
  ): string[] {
    const paragraphs: string[] = [];
    const en = this.language === 'en';

    // Paragraph 1: Suit dominance with card names
    if (theme.dominantSuit) {
      const suitCards = this.cards
        .filter(dc => dc.card.suit === theme.dominantSuit)
        .map(dc => dc.card.name)
        .slice(0, 2)
        .join(' and ');
      const suitCardsVi = this.cards
        .filter(dc => dc.card.suit === theme.dominantSuit)
        .map(dc => dc.card.name)
        .slice(0, 2)
        .join(' và ');

      const suitTexts: Record<string, [string, string]> = {
        wands:     [
          `${suitCards} lead the charge here—Wands bring fire, drive and creative ambition into the room. This is a reading about action, not waiting. What you've been building quietly is ready to move.`,
          `Bộ Gậy—với ${suitCardsVi}—mang lửa, động lực và tham vọng sáng tạo vào bài xem. Đây là lúc hành động, không phải chờ đợi. Những gì bạn đang xây dựng thầm lặng đã sẵn sàng để tiến lên.`,
        ],
        cups:      [
          `The presence of ${suitCards} tells you that the emotional layer of life is where the real work is happening right now. Cups invite you to feel fully, connect deeply, and trust what your intuition already knows.`,
          `Sự hiện diện của ${suitCardsVi} cho bạn biết rằng tầng cảm xúc của cuộc sống là nơi công việc thực sự đang diễn ra ngay bây giờ. Chén mời bạn cảm nhận đầy đủ, kết nối sâu sắc và tin vào những gì trực giác của bạn đã biết.`,
        ],
        swords:    [
          `${suitCards} sharpens the mind and cuts through confusion—but Swords can also cut too deep if unguided. The message here is to think clearly, speak honestly, and make decisions with both head and heart.`,
          `${suitCardsVi} mài sắc tâm trí và cắt qua sự nhầm lẫn—nhưng Kiếm cũng có thể cắt quá sâu nếu không được hướng dẫn. Thông điệp ở đây là suy nghĩ rõ ràng, nói thật lòng và đưa ra quyết định bằng cả lý trí lẫn tâm hồn.`,
        ],
        pentacles: [
          `${suitCards} grounds this reading in the practical world—what you can build, earn, and sustain. Pentacles are patient energy; they remind you that real, lasting growth is a craft, not a shortcut.`,
          `${suitCardsVi} neo bài xem này vào thế giới thực tế—những gì bạn có thể xây dựng, kiếm được và duy trì. Tiền xu là năng lượng kiên nhẫn; chúng nhắc bạn rằng sự phát triển thực sự và bền vững là một nghề, không phải một lối tắt.`,
        ],
      };
      const [enText, viText] = suitTexts[theme.dominantSuit] ?? ['', ''];
      if (enText) paragraphs.push(en ? enText : viText);
    }

    // Paragraph 2: Major Arcana weight — only if ≥50%
    if (theme.majorArcanaCount > 0) {
      const ratio = theme.majorArcanaCount / this.cards.length;
      if (ratio >= 0.5) {
        const majorCards = this.cards
          .filter(dc => dc.card.arcana === 'major')
          .map(dc => dc.card.name)
          .slice(0, 2)
          .join(en ? ' and ' : ' và ');
        paragraphs.push(
          en
            ? `${majorCards} ${theme.majorArcanaCount > 1 ? 'are' : 'is'} carrying considerable weight here. When Major Arcana dominate a reading, it means the forces at play are larger than day-to-day circumstance—these are soul-level lessons asking for your full attention.`
            : `${majorCards} mang trọng lượng đáng kể ở đây. Khi Bài Lớn chiếm ưu thế trong một bài xem, điều đó có nghĩa là các lực lượng đang hoạt động lớn hơn hoàn cảnh hàng ngày—đây là những bài học cấp độ tâm hồn đòi hỏi sự chú ý đầy đủ của bạn.`
        );
      }
    }

    // Paragraph 3: Supporting vs Challenging dynamics — card-name-aware
    if (supporting.length > 0 || challenging.length > 0) {
      const sup1 = supporting[0]?.card.name;
      const cha1 = challenging[0]?.card.name;

      if (supporting.length > challenging.length && sup1) {
        paragraphs.push(
          en
            ? `${sup1}${supporting.length > 1 ? ` and ${supporting.slice(1).map(d => d.card.name).join(', ')}` : ''} are quietly working in your corner. These cards form the supportive backbone of this reading—lean into what they represent when you feel uncertain.`
            : `${sup1}${supporting.length > 1 ? ` và ${supporting.slice(1).map(d => d.card.name).join(', ')}` : ''} đang âm thầm hỗ trợ bạn. Những lá bài này tạo thành xương sống hỗ trợ của bài xem—hãy dựa vào những gì chúng đại diện khi bạn cảm thấy không chắc chắn.`
        );
      } else if (challenging.length > supporting.length && cha1) {
        paragraphs.push(
          en
            ? `${cha1}${challenging.length > 1 ? ` and ${challenging.slice(1).map(d => d.card.name).join(', ')}` : ''} introduce friction into the story. This isn't bad news—friction is how we're shaped. These cards are pointing to something that deserves honest examination rather than avoidance.`
            : `${cha1}${challenging.length > 1 ? ` và ${challenging.slice(1).map(d => d.card.name).join(', ')}` : ''} đưa ma sát vào câu chuyện. Đây không phải là tin xấu—ma sát là cách chúng ta được định hình. Những lá bài này đang chỉ ra điều gì đó xứng đáng được kiểm tra trung thực hơn là né tránh.`
        );
      } else if (sup1 && cha1) {
        paragraphs.push(
          en
            ? `${sup1} and ${cha1} create an interesting tension in this reading—support and challenge existing side by side. The invitation here is not to resolve this tension too quickly, but to let it teach you.`
            : `${sup1} và ${cha1} tạo ra một căng thẳng thú vị trong bài xem này—hỗ trợ và thách thức tồn tại song song. Lời mời ở đây không phải là giải quyết căng thẳng này quá nhanh, mà là để nó dạy bạn.`
        );
      }
    }

    // Paragraph 4: Strongest card interaction — fully worded
    if (interactions.length > 0) {
      const top = interactions[0];
      paragraphs.push(
        en
          ? `The most striking relationship in this spread is between ${top.card1.name} and ${top.card2.name}. ${top.interpretation} This pairing is worth returning to when you reflect on this reading.`
          : `Mối quan hệ nổi bật nhất trong bài xem này là giữa ${top.card1.name} và ${top.card2.name}. ${top.interpretation} Cặp đôi này đáng để bạn quay lại khi suy ngẫm về bài xem.`
      );
    }

    return paragraphs;
  }

  /**
   * Generate conclusion — 3 variants per energy, card names woven in
   */
  private generateConclusion(theme: ReadingTheme): string {
    const lastCard = this.cards[this.cards.length - 1]?.card.name ?? '';
    const en = {
      positive: [
        `${lastCard} closes this reading on a note of forward motion. The message is not to wait for permission—the opening exists now. Step through it.`,
        `This reading ends in possibility. The work is not finished, but the direction is clear. Trust what has been illuminated here and keep moving.`,
        `The cards have been generous today. Take this energy with you—not as certainty, but as encouragement to act from your best self.`,
      ],
      negative: [
        `${lastCard} closes this reading with a quiet but firm reminder: awareness is the first act of change. You have seen what needs to be seen.`,
        `This reading asks more of you than comfort—it asks for honesty. The difficulty it names is real, but so is your capacity to meet it.`,
        `The cards have been honest today. That honesty is a gift. Use it to move more clearly, not to burden yourself—the insight here is meant to free you, not trap you.`,
      ],
      mixed: [
        `${lastCard} completes a reading that refuses to flatten your experience into simple answers. Life is complex, and the cards honour that. Hold both the light and shadow here—both are yours.`,
        `This reading leaves you at a crossroads, which is exactly where growth lives. There are no wrong paths forward—only more or less aligned ones.`,
        `The duality in this reading is a reflection of where you are right now. Neither fully open nor fully closed—in motion, in process, becoming.`,
      ],
      neutral: [
        `${lastCard} closes quietly, as this reading began. There is steadiness here. The cards are not pushing you—they are reminding you of what you already know.`,
        `This is a reading of grounded clarity. Nothing dramatic, nothing hidden—just an honest picture of where you stand. Use it.`,
        `The cards have offered a clear reflection. What you do with it is yours entirely. Trust yourself to know which parts most deserve your attention.`,
      ],
    };
    const vi = {
      positive: [
        `${lastCard} kết thúc bài xem này với một nốt nhạc của sự tiến về phía trước. Thông điệp là đừng chờ đợi sự cho phép—cơ hội đang mở ra ngay bây giờ. Hãy bước qua đó.`,
        `Bài xem này kết thúc trong khả năng. Công việc chưa hoàn thành, nhưng hướng đi đã rõ ràng. Tin vào những gì đã được soi sáng ở đây và tiếp tục tiến lên.`,
        `Các lá bài hôm nay rất hào phóng. Hãy mang năng lượng này theo—không phải như sự chắc chắn, mà như sự khuyến khích hành động từ bản thân tốt nhất của bạn.`,
      ],
      negative: [
        `${lastCard} kết thúc bài xem này với một lời nhắc nhở yên lặng nhưng vững chắc: nhận thức là hành động đầu tiên của sự thay đổi. Bạn đã thấy những gì cần được thấy.`,
        `Bài xem này đòi hỏi bạn nhiều hơn sự thoải mái—nó đòi hỏi sự trung thực. Khó khăn mà nó đặt tên là có thực, nhưng năng lực của bạn để đối mặt với nó cũng vậy.`,
        `Các lá bài hôm nay trung thực. Sự trung thực đó là một món quà. Sử dụng nó để di chuyển rõ ràng hơn, không phải để gánh nặng bản thân.`,
      ],
      mixed: [
        `${lastCard} hoàn thành một bài xem từ chối làm phẳng trải nghiệm của bạn thành những câu trả lời đơn giản. Cuộc sống phức tạp, và các lá bài tôn trọng điều đó.`,
        `Bài xem này để bạn ở ngã tư đường, đó chính xác là nơi sự tăng trưởng sống. Không có con đường sai nào tiến về phía trước—chỉ là phù hợp hay ít phù hợp hơn.`,
        `Tính song đối trong bài xem này là sự phản chiếu của nơi bạn đang ở ngay bây giờ. Không hoàn toàn mở cũng không hoàn toàn đóng—đang chuyển động, đang trong quá trình, đang trở thành.`,
      ],
      neutral: [
        `${lastCard} kết thúc yên tĩnh, như bài xem này bắt đầu. Có sự vững chắc ở đây. Các lá bài không thúc đẩy bạn—chúng nhắc bạn về những gì bạn đã biết.`,
        `Đây là bài xem của sự rõ ràng vững chắc. Không có gì kịch tính, không có gì ẩn giấu—chỉ là một bức tranh trung thực về nơi bạn đứng. Hãy sử dụng nó.`,
        `Các lá bài đã cung cấp một sự phản chiếu rõ ràng. Bạn làm gì với nó hoàn toàn là của bạn. Hãy tin vào bản thân để biết phần nào xứng đáng nhất với sự chú ý của bạn.`,
      ],
    };

    const pool = this.language === 'en' ? en : vi;
    const variants = pool[theme.overallEnergy];
    return variants[this.variantIndex(variants.length)];
  }

  // ─── Story Beats ────────────────────────────────────────────────────────────

  /**
   * Generate position-aware story beats — the primary narrative of the reading.
   * Each beat tells the story of one card in the context of its spread position,
   * connected to the next with a bridging phrase.
   */
  private generateStoryBeats(interactions: CardInteraction[]): StoryBeat[] {
    const en = this.language === 'en';
    const beats: StoryBeat[] = [];

    for (let i = 0; i < this.cards.length; i++) {
      const dc = this.cards[i];
      const position = this.spread.positions[i];
      const isFirst = i === 0;
      const isLast = i === this.cards.length - 1;
      const nextDc = this.cards[i + 1];

      const narrative = this.buildBeatNarrative(dc, position, isFirst, isLast, en);
      const connector = isLast
        ? null
        : this.buildConnector(position, nextDc ? this.spread.positions[i + 1] : null, interactions, dc, nextDc, en);

      beats.push({ drawnCard: dc, position, narrative, connector });
    }

    return beats;
  }

  /**
   * Build the narrative paragraph for one card in its position.
   */
  private buildBeatNarrative(
    dc: DrawnCard,
    position: SpreadPosition,
    isFirst: boolean,
    isLast: boolean,
    en: boolean,
  ): string {
    const meaning = dc.reversed ? dc.card.reversed : dc.card.upright;
    const shortMeaning = meaning.short;
    const generalMeaning = meaning.general;
    const cardName = dc.card.name;
    const posName = position.name;
    const posDesc = position.description;
    const reversedNote = dc.reversed
      ? (en ? ', though reversed' : ', dù ở vị trí ngược')
      : '';

    // Opening phrase — varies by position index
    let openPhrase: string;
    if (isFirst) {
      openPhrase = en
        ? `Your reading opens with **${cardName}** in the **${posName}** position — ${posDesc.toLowerCase()}`
        : `Bài xem của bạn mở ra với **${cardName}** ở vị trí **${posName}** — ${posDesc.toLowerCase()}`;
    } else if (isLast) {
      openPhrase = en
        ? `Finally, **${cardName}**${reversedNote} arrives in the **${posName}** position — ${posDesc.toLowerCase()}`
        : `Cuối cùng, **${cardName}**${reversedNote} xuất hiện ở vị trí **${posName}** — ${posDesc.toLowerCase()}`;
    } else {
      openPhrase = en
        ? `In the **${posName}** position — ${posDesc.toLowerCase()} — you find **${cardName}**${reversedNote}`
        : `Ở vị trí **${posName}** — ${posDesc.toLowerCase()} — bạn thấy **${cardName}**${reversedNote}`;
    }

    // Core meaning sentence
    const coreSentence = en
      ? `${shortMeaning}.`
      : `${shortMeaning}.`;

    // Contextual elaboration — pull from general meaning, trimmed to 1–2 sentences
    const generalSentences = generalMeaning.split(/(?<=[.!?])\s+/);
    const elaboration = generalSentences.slice(0, 2).join(' ');

    return `${openPhrase}. ${coreSentence} ${elaboration}`;
  }

  /**
   * Build a connector phrase that bridges one beat to the next,
   * sensitive to position roles and any known card interaction.
   */
  private buildConnector(
    fromPosition: SpreadPosition,
    toPosition: SpreadPosition | null,
    interactions: CardInteraction[],
    fromDc: DrawnCard,
    toDc: DrawnCard | undefined,
    en: boolean,
  ): string {
    if (!toDc || !toPosition) return '';

    // Check if these two cards have a known interaction
    const interaction = interactions.find(
      ix =>
        (ix.card1.id === fromDc.card.id && ix.card2.id === toDc.card.id) ||
        (ix.card1.id === toDc.card.id && ix.card2.id === fromDc.card.id)
    );

    // Interaction-aware connectors
    if (interaction) {
      const type = interaction.relationshipType;
      if (type === 'supporting') {
        return en
          ? `This energy flows naturally into what follows —`
          : `Năng lượng này chuyển tiếp tự nhiên vào những gì tiếp theo —`;
      }
      if (type === 'challenging') {
        return en
          ? `Yet this meets a point of tension —`
          : `Nhưng điều này gặp phải một điểm căng thẳng —`;
      }
      if (type === 'contradicting') {
        return en
          ? `This stands in contrast to what comes next —`
          : `Điều này tương phản với những gì đến tiếp theo —`;
      }
    }

    // Position-role-based connectors (read the to-position's name)
    const toName = toPosition.name.toLowerCase();

    if (toName.includes('challenge') || toName.includes('obstacle') || toName.includes('block')) {
      return en
        ? `But standing in the way is —`
        : `Nhưng đứng cản đường là —`;
    }
    if (toName.includes('future') || toName.includes('outcome') || toName.includes('result') || toName.includes('likely')) {
      return en
        ? `And looking ahead to what may come —`
        : `Và nhìn về phía trước những gì có thể đến —`;
    }
    if (toName.includes('action') || toName.includes('step') || toName.includes('advice')) {
      return en
        ? `The cards suggest a path forward —`
        : `Các lá bài gợi ý một con đường tiến về phía trước —`;
    }
    if (toName.includes('past') || toName.includes('root') || toName.includes('foundation')) {
      return en
        ? `Underneath this lies something older —`
        : `Bên dưới điều này ẩn chứa điều gì đó lâu đời hơn —`;
    }
    if (toName.includes('present') || toName.includes('now') || toName.includes('current')) {
      return en
        ? `This has shaped what you face right now —`
        : `Điều này đã định hình những gì bạn đang đối mặt ngay bây giờ —`;
    }
    if (toName.includes('hidden') || toName.includes('shadow') || toName.includes('unconscious')) {
      return en
        ? `Beneath the surface, something else stirs —`
        : `Bên dưới bề mặt, điều gì đó khác đang chuyển động —`;
    }
    if (toName.includes('hope') || toName.includes('fear') || toName.includes('desire')) {
      return en
        ? `Woven through this is an undercurrent of feeling —`
        : `Xuyên suốt điều này là một dòng cảm xúc ngầm —`;
    }
    if (toName.includes('support') || toName.includes('resource') || toName.includes('aid') || toName.includes('gift')) {
      return en
        ? `Yet you are not navigating this alone —`
        : `Nhưng bạn không điều hướng điều này một mình —`;
    }
    if (toName.includes('lesson') || toName.includes('wisdom') || toName.includes('purpose')) {
      return en
        ? `And from all of this emerges a deeper insight —`
        : `Và từ tất cả những điều này nổi lên một hiểu biết sâu sắc hơn —`;
    }

    // Generic sequential connectors (cycle through a few so it feels varied)
    const genericEn = [
      'From here, the story shifts —',
      'Building on this foundation —',
      'The reading then turns to —',
      'This energy carries forward into —',
    ];
    const genericVi = [
      'Từ đây, câu chuyện chuyển sang —',
      'Xây dựng trên nền tảng này —',
      'Bài xem sau đó hướng đến —',
      'Năng lượng này tiếp tục vào —',
    ];
    const seed = (fromDc.card.id + toDc.card.id) % genericEn.length;
    return en ? genericEn[seed] : genericVi[seed];
  }

  /**
   * Generate advice — card-name-aware, varied by energy
   */
  private generateAdvice(
    theme: ReadingTheme,
    supporting: DrawnCard[],
    challenging: DrawnCard[]
  ): string {
    const en = this.language === 'en';
    const sup = supporting[0]?.card.name;
    const cha = challenging[0]?.card.name;

    const parts: string[] = [];

    if (sup) {
      parts.push(
        en
          ? `Let ${sup} be your anchor—return to its energy when you need steadiness.`
          : `Hãy để ${sup} là neo đậu của bạn—trở lại với năng lượng của nó khi bạn cần sự vững chắc.`
      );
    }

    if (cha) {
      parts.push(
        en
          ? `When ${cha} surfaces in your life, meet it with curiosity rather than resistance—there's something in that friction worth understanding.`
          : `Khi ${cha} xuất hiện trong cuộc sống của bạn, hãy đón nhận nó với sự tò mò hơn là kháng cự—có điều gì đó trong sự ma sát đó đáng để hiểu.`
      );
    }

    parts.push(
      en
        ? 'The cards are a mirror, not a map. They show you what is present, not what is fixed. You hold the power to shape what comes next.'
        : 'Các lá bài là một tấm gương, không phải bản đồ. Chúng cho bạn thấy những gì hiện diện, không phải những gì đã cố định. Bạn nắm giữ quyền lực để định hình những gì xảy ra tiếp theo.'
    );

    return parts.join(' ');
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
