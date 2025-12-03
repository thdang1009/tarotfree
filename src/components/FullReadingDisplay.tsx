/**
 * Full Reading Display Component
 * Displays the synthesized reading analysis with beautiful UI
 */

import { useState, useEffect } from 'react';
import type { FullReadingAnalysis } from '../types/reading';
import type { DrawnCard, TarotSpread } from '../types/tarot';
import { analyzeReading } from '../utils/readingAnalyzer';
import MysteryVoiceButton from './MysteryVoiceButton';

interface FullReadingDisplayProps {
  cards: DrawnCard[];
  spread: TarotSpread;
  question?: string;
}

export default function FullReadingDisplay({
  cards,
  spread,
  question = ''
}: FullReadingDisplayProps) {
  const [analysis, setAnalysis] = useState<FullReadingAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate analysis delay for dramatic effect
    const timer = setTimeout(() => {
      const result = analyzeReading(cards, spread, question);
      setAnalysis(result);
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [cards, spread, question]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 p-6">
        <div className="h-8 bg-violet-light/30 rounded w-3/4 mx-auto"></div>
        <div className="h-4 bg-violet-light/20 rounded w-full"></div>
        <div className="h-4 bg-violet-light/20 rounded w-5/6"></div>
        <div className="h-4 bg-violet-light/20 rounded w-4/5"></div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl shadow-2xl">
      {/* Header */}
      <div className="text-center border-b-2 border-violet-light/30 pb-6">
        <h2 className="text-4xl font-heading text-violet-deep mb-2">
          ✨ Full Reading Synthesis
        </h2>
        <p className="text-lg text-violet-medium font-semibold">
          {analysis.theme.primaryTheme}
        </p>
      </div>

      {/* Opening */}
      <section className="prose prose-lg max-w-none">
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
          {analysis.theme.dominantSuit && (
            <div>
              <p className="font-semibold text-violet-medium">Dominant Suit:</p>
              <p className="text-lg capitalize">{analysis.theme.dominantSuit}</p>
            </div>
          )}
          {analysis.theme.majorArcanaCount > 0 && (
            <div>
              <p className="font-semibold text-violet-medium">Major Arcana:</p>
              <p className="text-lg">{analysis.theme.majorArcanaCount} card(s)</p>
            </div>
          )}
          {analysis.theme.secondaryThemes.length > 0 && (
            <div className="md:col-span-2">
              <p className="font-semibold text-violet-medium mb-2">Secondary Themes:</p>
              <div className="flex flex-wrap gap-2">
                {analysis.theme.secondaryThemes.map(theme => (
                  <span
                    key={theme}
                    className="px-3 py-1 bg-violet-deep/10 text-violet-deep rounded-full text-sm"
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
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className={`
                      px-2 py-1 rounded text-xs font-semibold uppercase
                      ${
                        interaction.relationshipType === 'supporting'
                          ? 'bg-green-200 text-green-800'
                          : interaction.relationshipType === 'challenging'
                          ? 'bg-red-200 text-red-800'
                          : interaction.relationshipType === 'complementary'
                          ? 'bg-blue-200 text-blue-800'
                          : interaction.relationshipType === 'contradicting'
                          ? 'bg-amber-200 text-amber-800'
                          : 'bg-gray-200 text-gray-800'
                      }
                    `}
                  >
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
                  {dc.reversed && (
                    <span className="text-xs text-gray-600">(Reversed)</span>
                  )}
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
                  {dc.reversed && (
                    <span className="text-xs text-gray-600">(Reversed)</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Outcome Influencers */}
      {analysis.outcomeInfluencers.length > 0 && (
        <section className="bg-violet-deep/5 rounded-lg p-6">
          <h3 className="text-xl font-heading text-violet-deep mb-3">
            🎯 Outcome Influencers
          </h3>
          <div className="flex flex-wrap gap-3">
            {analysis.outcomeInfluencers.map(dc => (
              <div
                key={dc.position}
                className="bg-white px-4 py-2 rounded-lg shadow-sm"
              >
                <span className="font-semibold text-violet-deep">
                  {dc.card.name}
                </span>
                {dc.reversed && (
                  <span className="text-xs text-gray-600 ml-2">(Reversed)</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Conclusion */}
      <section className="bg-violet-deep text-white rounded-lg p-6">
        <h3 className="text-2xl font-heading mb-4">🌙 Conclusion</h3>
        <p className="text-lg leading-relaxed mb-6">
          {analysis.synthesis.conclusion}
        </p>

        <div className="border-t border-violet-light/30 pt-4">
          <h4 className="text-xl font-heading mb-2">💫 Advice</h4>
          <p className="text-lg leading-relaxed">{analysis.synthesis.advice}</p>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="text-center text-sm text-gray-600 italic pt-4 border-t border-violet-light/30">
        <p>
          This reading is generated based on traditional tarot interpretations and card
          relationships. Trust your intuition as the final guide.
        </p>
      </section>

      {/* Mystery Voice Button - Floating, rendered outside */}
      <MysteryVoiceButton analysis={analysis} />
    </div>
  );
}
