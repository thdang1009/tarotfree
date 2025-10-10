import React from 'react';
import type { TarotSpread } from '../types/tarot';
import type { SelectedCard } from './CardDeck';

interface SpreadLayoutProps {
  spread: TarotSpread;
  selectedCards: SelectedCard[];
  cardsData: any[];
}

interface CardPosition {
  x: number;
  y: number;
  rotation?: number;
}

/**
 * Calculates positions for cards based on layout_type and layout_grid
 */
function calculateCardPositions(layoutType: string, layoutGrid: number[], cardCount: number): CardPosition[] {
  const positions: CardPosition[] = [];
  const cardWidth = 120; // Card width in pixels
  const cardHeight = 180; // Card height in pixels
  const spacing = 20; // Spacing between cards

  let cardIndex = 0;

  switch (layoutType) {
    case 'Line':
      // Horizontal line layout
      const totalWidth = cardCount * cardWidth + (cardCount - 1) * spacing;
      for (let i = 0; i < cardCount; i++) {
        positions.push({
          x: i * (cardWidth + spacing) - totalWidth / 2 + cardWidth / 2,
          y: 0,
        });
      }
      break;

    case 'VerticalLine':
      // Vertical line layout
      const totalHeight = cardCount * (cardHeight + spacing);
      for (let i = 0; i < cardCount; i++) {
        positions.push({
          x: 0,
          y: i * (cardHeight + spacing) - totalHeight / 2 + cardHeight / 2,
        });
      }
      break;

    case 'Cross':
    case 'Grid':
      // Grid-based layout (rows defined by layout_grid)
      let currentY = 0;
      const rowHeights: number[] = [];

      // Calculate total height
      layoutGrid.forEach(rowCount => {
        rowHeights.push(currentY);
        currentY += cardHeight + spacing;
      });
      const gridTotalHeight = currentY - spacing;

      cardIndex = 0;
      layoutGrid.forEach((rowCount, rowIndex) => {
        const rowWidth = rowCount * cardWidth + (rowCount - 1) * spacing;
        for (let col = 0; col < rowCount; col++) {
          positions.push({
            x: col * (cardWidth + spacing) - rowWidth / 2 + cardWidth / 2,
            y: rowHeights[rowIndex] - gridTotalHeight / 2,
          });
          cardIndex++;
        }
      });
      break;

    case 'Square':
      // 2x2 square layout
      const squareSpacing = 30;
      positions.push(
        { x: -(cardWidth / 2 + squareSpacing / 2), y: -(cardHeight / 2 + squareSpacing / 2) },
        { x: cardWidth / 2 + squareSpacing / 2, y: -(cardHeight / 2 + squareSpacing / 2) },
        { x: -(cardWidth / 2 + squareSpacing / 2), y: cardHeight / 2 + squareSpacing / 2 },
        { x: cardWidth / 2 + squareSpacing / 2, y: cardHeight / 2 + squareSpacing / 2 }
      );
      break;

    case 'Bridge':
      // Bridge pattern: row1, center, row2
      cardIndex = 0;
      let bridgeY = -(cardHeight + spacing);
      layoutGrid.forEach((rowCount, rowIdx) => {
        const rowWidth = rowCount * cardWidth + (rowCount - 1) * spacing;
        for (let col = 0; col < rowCount; col++) {
          positions.push({
            x: col * (cardWidth + spacing) - rowWidth / 2 + cardWidth / 2,
            y: bridgeY,
          });
          cardIndex++;
        }
        bridgeY += cardHeight + spacing;
      });
      break;

    case 'VerticalSplit':
      // Two columns with centered rows
      cardIndex = 0;
      let splitY = 0;
      const columnSpacing = 40;
      layoutGrid.forEach((rowCount, rowIdx) => {
        if (rowCount === 1) {
          positions.push({ x: 0, y: splitY });
        } else if (rowCount === 2) {
          positions.push(
            { x: -(cardWidth / 2 + columnSpacing / 2), y: splitY },
            { x: cardWidth / 2 + columnSpacing / 2, y: splitY }
          );
        }
        splitY += cardHeight + spacing;
        cardIndex += rowCount;
      });
      break;

    case 'Arrow':
    case 'Stairs':
      // Progressive stair-step pattern
      cardIndex = 0;
      let stairY = 0;
      const stairOffset = 60;
      layoutGrid.forEach((rowCount, rowIdx) => {
        const rowWidth = rowCount * cardWidth + (rowCount - 1) * spacing;
        for (let col = 0; col < rowCount; col++) {
          positions.push({
            x: col * (cardWidth + spacing) - rowWidth / 2 + cardWidth / 2 + (rowIdx * stairOffset),
            y: stairY,
          });
          cardIndex++;
        }
        stairY += cardHeight + spacing;
      });
      break;

    case 'Diamond':
      // Diamond shape
      cardIndex = 0;
      let diamondY = 0;
      const diamondHeight = layoutGrid.length * (cardHeight + spacing);
      layoutGrid.forEach((rowCount, rowIdx) => {
        const rowWidth = rowCount * cardWidth + (rowCount - 1) * spacing;
        for (let col = 0; col < rowCount; col++) {
          positions.push({
            x: col * (cardWidth + spacing) - rowWidth / 2 + cardWidth / 2,
            y: diamondY - diamondHeight / 2,
          });
          cardIndex++;
        }
        diamondY += cardHeight + spacing;
      });
      break;

    case 'CelticCross':
      // Special Celtic Cross layout
      positions.push(
        { x: 0, y: 0 }, // 1. Present (center)
        { x: 0, y: 0, rotation: 90 }, // 2. Challenge (crossing)
        { x: 0, y: -(cardHeight + spacing) * 1.5 }, // 3. Root (above)
        { x: -(cardWidth + spacing), y: 0 }, // 4. Recent Past (left)
        { x: 0, y: (cardHeight + spacing) * 1.5 }, // 5. Potential (below)
        { x: cardWidth + spacing, y: 0 }, // 6. Immediate Future (right)
        { x: (cardWidth + spacing) * 2.5, y: (cardHeight + spacing) * 1.5 }, // 7. Self (staff bottom)
        { x: (cardWidth + spacing) * 2.5, y: (cardHeight + spacing) * 0.5 }, // 8. External (staff)
        { x: (cardWidth + spacing) * 2.5, y: -(cardHeight + spacing) * 0.5 }, // 9. Hopes/Fears (staff)
        { x: (cardWidth + spacing) * 2.5, y: -(cardHeight + spacing) * 1.5 } // 10. Outcome (staff top)
      );
      break;

    case 'T-Shape':
      // T-shaped layout
      const tTopRow = layoutGrid[0];
      const tTopWidth = tTopRow * cardWidth + (tTopRow - 1) * spacing;
      for (let i = 0; i < tTopRow; i++) {
        positions.push({
          x: i * (cardWidth + spacing) - tTopWidth / 2 + cardWidth / 2,
          y: -(cardHeight + spacing),
        });
      }
      // Stem of T
      for (let i = 1; i < layoutGrid.length; i++) {
        positions.push({
          x: 0,
          y: (i - 1) * (cardHeight + spacing),
        });
      }
      break;

    case 'Arch':
      // Arch pattern
      cardIndex = 0;
      let archY = 0;
      layoutGrid.forEach((rowCount, rowIdx) => {
        const rowWidth = rowCount * cardWidth + (rowCount - 1) * spacing;
        const archCurve = rowIdx === 0 ? -30 : 0; // Curve the top row
        for (let col = 0; col < rowCount; col++) {
          positions.push({
            x: col * (cardWidth + spacing) - rowWidth / 2 + cardWidth / 2,
            y: archY + archCurve,
          });
          cardIndex++;
        }
        archY += cardHeight + spacing;
      });
      break;

    case 'Spiral':
      // Simple vertical spiral with slight offset
      for (let i = 0; i < cardCount; i++) {
        const angle = (i * 30 * Math.PI) / 180;
        const radius = 20 + i * 10;
        positions.push({
          x: Math.cos(angle) * radius,
          y: i * (cardHeight + spacing) - ((cardCount - 1) * (cardHeight + spacing)) / 2,
        });
      }
      break;

    case 'Funnel':
      // Funnel shape (wide to narrow)
      cardIndex = 0;
      let funnelY = 0;
      layoutGrid.forEach((rowCount, rowIdx) => {
        const rowWidth = rowCount * cardWidth + (rowCount - 1) * spacing;
        for (let col = 0; col < rowCount; col++) {
          positions.push({
            x: col * (cardWidth + spacing) - rowWidth / 2 + cardWidth / 2,
            y: funnelY,
          });
          cardIndex++;
        }
        funnelY += cardHeight + spacing;
      });
      break;

    default:
      // Default to line layout
      const defaultWidth = cardCount * cardWidth + (cardCount - 1) * spacing;
      for (let i = 0; i < cardCount; i++) {
        positions.push({
          x: i * (cardWidth + spacing) - defaultWidth / 2 + cardWidth / 2,
          y: 0,
        });
      }
  }

  return positions;
}

export default function SpreadLayout({ spread, selectedCards, cardsData }: SpreadLayoutProps) {
  const positions = calculateCardPositions(spread.layout_type, spread.layout_grid, spread.cardCount);

  // Scale factor for mobile vs desktop
  const scale = 0.7; // Reduced scale for better mobile fit

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="relative flex items-center justify-center min-h-[400px] md:min-h-[600px] py-4 md:py-8 px-2">
        <div
          className="relative mx-auto"
          style={{
            minWidth: '320px',
            width: '100%',
            maxWidth: '900px',
            minHeight: '400px',
          }}
        >
          {positions.map((pos, index) => {
            const card = selectedCards[index];
            const hasCard = !!card;
            const cardData = hasCard ? cardsData[card.cardId] : null;
            const positionInfo = spread.positions[index];

            return (
              <div
                key={index}
                className="absolute transition-all duration-500 ease-out"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${pos.x * scale}px), calc(-50% + ${pos.y * scale}px)) rotate(${pos.rotation || 0}deg)`,
                }}
              >
                {hasCard ? (
                  // Drawn card
                  <div className="animate-fadeIn">
                    <div
                      className={`w-[70px] h-[105px] sm:w-[90px] sm:h-[135px] md:w-[120px] md:h-[180px] rounded-lg shadow-xl md:shadow-2xl border-2 md:border-4 border-gold-soft overflow-hidden transform transition-all duration-300 hover:scale-105 ${
                        card.reversed ? 'rotate-180' : ''
                      }`}
                    >
                      <img
                        src={cardData.image}
                        alt={cardData.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-center mt-1 md:mt-2 text-xs md:text-sm max-w-[70px] sm:max-w-[90px] md:max-w-[120px] mx-auto">
                      <p className="font-semibold text-violet-deep truncate text-[10px] sm:text-xs md:text-sm">{positionInfo.name}</p>
                      <p className="text-gray-600 text-[9px] sm:text-[10px] md:text-xs truncate">{cardData.name}</p>
                      {card.reversed && (
                        <span className="text-orange-600 text-[9px] sm:text-[10px] md:text-xs flex items-center justify-center gap-1">
                          <span className="inline-block rotate-180">↑</span> Reversed
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  // Empty placeholder
                  <div className="opacity-60">
                    <div className="w-[70px] h-[105px] sm:w-[90px] sm:h-[135px] md:w-[120px] md:h-[180px] rounded-lg bg-gradient-to-br from-violet-100 to-violet-200 border-2 border-dashed border-violet-300 flex flex-col items-center justify-center text-violet-400">
                      <span className="text-xl sm:text-2xl md:text-3xl mb-1">?</span>
                      <span className="text-[9px] sm:text-[10px] md:text-xs text-center px-1">{index + 1}</span>
                    </div>
                    <div className="text-center mt-1 md:mt-2 max-w-[70px] sm:max-w-[90px] md:max-w-[120px] mx-auto">
                      <p className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-500 truncate">{positionInfo.name}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
