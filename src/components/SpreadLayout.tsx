import React from 'react';
import type { TarotSpread } from '../types/tarot';
import type { SelectedCard } from './CardDeck';

interface SpreadLayoutProps {
  spread: TarotSpread;
  selectedCards: SelectedCard[];
  cardsData: any[];
}

/**
 * Renders a card or placeholder in the spread
 */
function CardSlot({
  card,
  cardData,
  positionInfo,
  index
}: {
  card?: SelectedCard;
  cardData?: any;
  positionInfo: any;
  index: number;
}) {
  const hasCard = !!card;

  return (
    <div className="flex flex-col items-center gap-1 md:gap-2">
      {hasCard ? (
        <div className="animate-fadeIn">
          <div
            className={`w-[70px] h-[105px] sm:w-[90px] sm:h-[135px] md:w-[110px] md:h-[165px] rounded-lg shadow-xl border-2 md:border-3 border-gold-soft overflow-hidden transform transition-all duration-300 hover:scale-105 ${
              card.reversed ? 'rotate-180' : ''
            }`}
          >
            <img
              src={cardData.image}
              alt={cardData.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center mt-1 max-w-[70px] sm:max-w-[90px] md:max-w-[110px] mx-auto">
            <p className="font-semibold text-violet-deep text-[10px] sm:text-xs truncate">{positionInfo.name}</p>
            <p className="text-gray-600 text-[9px] sm:text-[10px] truncate">{cardData.name}</p>
            {card.reversed && (
              <span className="text-orange-600 text-[9px] sm:text-[10px] flex items-center justify-center gap-1">
                <span className="inline-block rotate-180">↑</span> Reversed
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="opacity-60">
          <div className="w-[70px] h-[105px] sm:w-[90px] sm:h-[135px] md:w-[110px] md:h-[165px] rounded-lg bg-gradient-to-br from-violet-100 to-violet-200 border-2 border-dashed border-violet-300 flex flex-col items-center justify-center text-violet-400">
            <span className="text-xl sm:text-2xl mb-1">?</span>
            <span className="text-[9px] sm:text-[10px] text-center px-1">{index + 1}</span>
          </div>
          <div className="text-center mt-1 max-w-[70px] sm:max-w-[90px] md:max-w-[110px] mx-auto">
            <p className="text-[9px] sm:text-[10px] font-semibold text-gray-500 truncate">{positionInfo.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Renders spread layout using flexbox/grid instead of absolute positioning
 */
export default function SpreadLayout({ spread, selectedCards, cardsData }: SpreadLayoutProps) {
  const { layout_type, layout_grid, positions } = spread;

  // Render different layouts based on layout_type
  const renderLayout = () => {
    switch (layout_type) {
      case 'Line':
      case 'VerticalLine':
        // Simple line layout
        return (
          <div className={`flex ${layout_type === 'VerticalLine' ? 'flex-col' : 'flex-row flex-wrap'} items-center justify-center gap-3 md:gap-4`}>
            {positions.map((pos, idx) => {
              const card = selectedCards[idx];
              const cardData = card ? cardsData[card.cardId] : null;
              return <CardSlot key={idx} card={card} cardData={cardData} positionInfo={pos} index={idx} />;
            })}
          </div>
        );

      case 'Grid':
      case 'Cross':
      case 'Square':
      case 'Diamond':
      case 'Funnel':
      case 'Bridge':
      case 'Arch':
      case 'Stairs':
      case 'Arrow':
        // Grid-based layouts with rows
        let cardIdx = 0;
        return (
          <div className="flex flex-col items-center justify-center gap-3 md:gap-4">
            {layout_grid.map((rowCount, rowIdx) => (
              <div key={rowIdx} className="flex flex-row items-center justify-center gap-3 md:gap-4 flex-wrap">
                {Array.from({ length: rowCount }).map((_, colIdx) => {
                  const currentIdx = cardIdx++;
                  const card = selectedCards[currentIdx];
                  const cardData = card ? cardsData[card.cardId] : null;
                  const pos = positions[currentIdx];
                  return <CardSlot key={currentIdx} card={card} cardData={cardData} positionInfo={pos} index={currentIdx} />;
                })}
              </div>
            ))}
          </div>
        );

      case 'VerticalSplit':
        // Two columns layout
        cardIdx = 0;
        return (
          <div className="flex flex-col items-center justify-center gap-3 md:gap-4">
            {layout_grid.map((rowCount, rowIdx) => (
              <div key={rowIdx} className="flex flex-row items-center justify-center gap-6 md:gap-8">
                {Array.from({ length: rowCount }).map((_, colIdx) => {
                  const currentIdx = cardIdx++;
                  const card = selectedCards[currentIdx];
                  const cardData = card ? cardsData[card.cardId] : null;
                  const pos = positions[currentIdx];
                  return <CardSlot key={currentIdx} card={card} cardData={cardData} positionInfo={pos} index={currentIdx} />;
                })}
              </div>
            ))}
          </div>
        );

      case 'T-Shape':
        // T-shape: top row, then vertical stem
        const topRowCount = layout_grid[0];
        cardIdx = 0;
        return (
          <div className="flex flex-col items-center justify-center gap-3 md:gap-4">
            {/* Top row */}
            <div className="flex flex-row items-center justify-center gap-3 md:gap-4">
              {Array.from({ length: topRowCount }).map((_, colIdx) => {
                const currentIdx = cardIdx++;
                const card = selectedCards[currentIdx];
                const cardData = card ? cardsData[card.cardId] : null;
                const pos = positions[currentIdx];
                return <CardSlot key={currentIdx} card={card} cardData={cardData} positionInfo={pos} index={currentIdx} />;
              })}
            </div>
            {/* Stem */}
            {Array.from({ length: layout_grid.length - 1 }).map((_, stemIdx) => {
              const currentIdx = cardIdx++;
              const card = selectedCards[currentIdx];
              const cardData = card ? cardsData[card.cardId] : null;
              const pos = positions[currentIdx];
              return <CardSlot key={currentIdx} card={card} cardData={cardData} positionInfo={pos} index={currentIdx} />;
            })}
          </div>
        );

      case 'CelticCross':
        // Special Celtic Cross layout
        return (
          <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-6 md:gap-8">
            {/* Left side: Cross formation */}
            <div className="relative flex items-center justify-center" style={{ minWidth: '250px', minHeight: '250px' }}>
              <div className="grid grid-cols-3 grid-rows-3 gap-2 items-center justify-items-center">
                {/* Row 1 */}
                <div></div>
                <div className="row-start-1 col-start-2">
                  <CardSlot card={selectedCards[2]} cardData={selectedCards[2] ? cardsData[selectedCards[2].cardId] : null} positionInfo={positions[2]} index={2} />
                </div>
                <div></div>
                {/* Row 2 */}
                <div className="row-start-2 col-start-1">
                  <CardSlot card={selectedCards[3]} cardData={selectedCards[3] ? cardsData[selectedCards[3].cardId] : null} positionInfo={positions[3]} index={3} />
                </div>
                <div className="row-start-2 col-start-2 relative">
                  {/* Center: Card 1 and Card 2 (crossing) */}
                  <div className="relative">
                    <CardSlot card={selectedCards[0]} cardData={selectedCards[0] ? cardsData[selectedCards[0].cardId] : null} positionInfo={positions[0]} index={0} />
                    {selectedCards[1] && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-90 opacity-90">
                        <CardSlot card={selectedCards[1]} cardData={cardsData[selectedCards[1].cardId]} positionInfo={positions[1]} index={1} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="row-start-2 col-start-3">
                  <CardSlot card={selectedCards[5]} cardData={selectedCards[5] ? cardsData[selectedCards[5].cardId] : null} positionInfo={positions[5]} index={5} />
                </div>
                {/* Row 3 */}
                <div></div>
                <div className="row-start-3 col-start-2">
                  <CardSlot card={selectedCards[4]} cardData={selectedCards[4] ? cardsData[selectedCards[4].cardId] : null} positionInfo={positions[4]} index={4} />
                </div>
                <div></div>
              </div>
            </div>
            {/* Right side: Staff (vertical line) */}
            <div className="flex flex-col items-center justify-center gap-2 md:gap-3">
              {[6, 7, 8, 9].map((idx) => (
                <CardSlot
                  key={idx}
                  card={selectedCards[idx]}
                  cardData={selectedCards[idx] ? cardsData[selectedCards[idx].cardId] : null}
                  positionInfo={positions[idx]}
                  index={idx}
                />
              ))}
            </div>
          </div>
        );

      case 'Spiral':
        // Spiral shown as vertical line with slight offset
        return (
          <div className="flex flex-col items-center justify-center gap-2 md:gap-3">
            {positions.map((pos, idx) => {
              const card = selectedCards[idx];
              const cardData = card ? cardsData[card.cardId] : null;
              return (
                <div key={idx} style={{ marginLeft: `${idx * 10}px` }}>
                  <CardSlot card={card} cardData={cardData} positionInfo={pos} index={idx} />
                </div>
              );
            })}
          </div>
        );

      default:
        // Default: simple grid
        return (
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 max-w-4xl mx-auto">
            {positions.map((pos, idx) => {
              const card = selectedCards[idx];
              const cardData = card ? cardsData[card.cardId] : null;
              return <CardSlot key={idx} card={card} cardData={cardData} positionInfo={pos} index={idx} />;
            })}
          </div>
        );
    }
  };

  return (
    <div className="w-full py-2 md:py-4 px-2">
      <div className="max-w-6xl mx-auto">
        {renderLayout()}
      </div>
    </div>
  );
}
