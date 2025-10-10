# Building a Free Tarot Reading Website in One Day: A Developer's Journey

**Date:** October 10, 2025
**Project:** TarotFree - A privacy-first, ad-free tarot reading web application
**Time Frame:** 6:30 AM - Present (Same Day)
**Tech Stack:** Astro, React, TypeScript, Tailwind CSS 4, Netlify

---

## Table of Contents
1. [Introduction](#introduction)
2. [Morning Brainstorming: Choosing the Right Stack](#morning-brainstorming-choosing-the-right-stack)
3. [Project Setup & Architecture Decisions](#project-setup--architecture-decisions)
4. [Core Features Implementation](#core-features-implementation)
5. [The Mobile CSS Challenge](#the-mobile-css-challenge)
6. [Enhancing User Experience](#enhancing-user-experience)
7. [Deployment & Final Touches](#deployment--final-touches)
8. [Lessons Learned](#lessons-learned)
9. [What's Next](#whats-next)

---

## Introduction

Today, I embarked on an ambitious journey: building a fully functional tarot reading website from scratch in a single day. The goal was to create a **free, privacy-respecting, and beautiful** tarot reading experience with no ads, no tracking, and no login requirements. Just you, the cards, and your intuition.

This blog post chronicles the entire development process, from the first line of code at 6:30 AM to the polished application you see now. Let me take you through every decision, challenge, and breakthrough along the way.

---

## Morning Brainstorming: Choosing the Right Stack

### 6:30 AM - The First Decision: Which Framework?

The first challenge wasn't writing code—it was choosing the right tools. I had several requirements:

**Must-haves:**
- ⚡ Fast page loads (users want their readings quickly)
- 📱 Perfect mobile responsiveness (most tarot seekers use phones)
- 🎨 Beautiful, mystical design
- 🔒 Privacy-first (no server-side processing of readings)
- 💰 Free hosting

**Framework Evaluation:**

| Framework | Pros | Cons | Verdict |
|-----------|------|------|---------|
| **Next.js** | Popular, great DX | Overkill for content-heavy site | ❌ Too heavy |
| **SvelteKit** | Lightweight, fast | Smaller ecosystem | 🤔 Maybe |
| **Astro** | Perfect for content, islands architecture | Newer framework | ✅ **WINNER** |

**Why Astro Won:**

Astro's **Islands Architecture** was perfect for this project. Most of the site is static content (card meanings, spread descriptions), but I needed interactive components for card selection. Astro lets me:

1. Ship **zero JavaScript** for static pages
2. Hydrate only the interactive components (card deck)
3. Use React for complex interactions
4. Get excellent SEO out of the box

### The Supporting Cast

Once Astro was chosen, the rest fell into place:

```typescript
// package.json - The final stack
{
  "dependencies": {
    "astro": "^5.14.3",           // Core framework
    "@astrojs/react": "^4.4.0",    // For interactive components
    "@astrojs/netlify": "^6.5.12", // Easy deployment
    "@astrojs/sitemap": "^3.6.0",  // SEO
    "tailwindcss": "^4.1.14",      // Styling
    "react": "^19.2.0",            // UI library
    "fuse.js": "^7.1.0",           // Search functionality
    "html2canvas": "^1.4.1"        // Export readings as images
  }
}
```

**Tailwind CSS 4** was a no-brainer for rapid, beautiful styling. The new version's performance improvements and better CSS variables support made theming a breeze.

---

## Project Setup & Architecture Decisions

### 7:00 AM - Project Structure

I structured the project for maximum clarity and maintainability:

```
tarotfree/
├── src/
│   ├── components/         # React components
│   │   ├── CardDeck.tsx           # Main card selection UI
│   │   ├── CardDeckWrapper.tsx    # Navigation wrapper
│   │   ├── SpreadLayout.tsx       # Dynamic spread layouts
│   │   └── ResultSpreadDisplay.tsx
│   ├── data/              # Static data
│   │   ├── cards.json     # All 78 tarot cards
│   │   └── spreads.json   # Spread configurations
│   ├── layouts/
│   │   └── Layout.astro   # Base layout
│   ├── pages/             # Route pages
│   │   ├── index.astro           # Homepage
│   │   ├── reading/[spreadId].astro  # Dynamic reading pages
│   │   ├── result/[...params].astro  # Results (SSR)
│   │   └── cards/                # Card library
│   ├── styles/
│   │   └── global.css     # Tailwind + custom theme
│   ├── types/
│   │   └── tarot.ts       # TypeScript interfaces
│   └── utils/
│       ├── rng.ts         # Crypto-secure randomness
│       └── storage.ts     # Local storage helpers
└── astro.config.mjs
```

### Key Architecture Decisions

#### 1. **Crypto-Secure Randomness**

For a tarot app, randomness is sacred. I refused to use `Math.random()` and instead implemented crypto-secure shuffling:

```typescript
// src/utils/rng.ts
export function shuffleDeck<T>(array: T[]): T[] {
  const shuffled = [...array];
  const randomValues = new Uint32Array(shuffled.length);
  crypto.getRandomValues(randomValues); // 🔐 Crypto-secure!

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function isReversed(): boolean {
  const randomValue = new Uint8Array(1);
  crypto.getRandomValues(randomValue);
  return randomValue[0] > 127; // True 50/50 split
}
```

**Why this matters:** Users trust their readings. Using cryptographic randomness ensures truly unpredictable results, not pseudo-random patterns.

#### 2. **URL-Based State (No Database Needed!)**

One of my favorite decisions: encoding the entire reading in the URL. This means:
- ✅ No backend needed
- ✅ Readings are shareable
- ✅ Users can bookmark their results
- ✅ Complete privacy (nothing stored on servers)

```typescript
// Format: /result/{spreadId}/{cardIds}/{reversedBits}
// Example: /result/3-card/42-13-67/010
//                 └─ Spread └─ Cards └─ Reversed flags

const handleCardsSelected = (selectedCards: any[]) => {
  const cardIds = selectedCards.map(sc => sc.cardId).join('-');
  const reversed = selectedCards.map(sc => sc.reversed ? '1' : '0').join('');
  const url = `/result/${spreadId}/${cardIds}/${reversed}`;
  window.location.href = url;
};
```

#### 3. **Hybrid Rendering Strategy**

```typescript
// astro.config.mjs
export default defineConfig({
  output: 'server',           // SSR for dynamic routes
  adapter: netlify(),         // Deploy to Netlify
  integrations: [
    react(),                  // Islands for interactivity
    sitemap()                 // SEO
  ]
});
```

- **Static pages:** Homepage, card library (pre-rendered)
- **Dynamic pages:** Reading selection, results (SSR)
- **Client-only:** Card deck interaction (React island)

---

## Core Features Implementation

### 8:30 AM - Building the Card Deck Component

The heart of the app is the card selection interface. I wanted something **magical** and **intuitive**.

#### The Fan Spread Effect

After several iterations, I created a beautiful fan spread using pure CSS transforms:

```typescript
// CardDeck.tsx - Fan spread calculations
const totalCards = 78;
const spreadAngle = 140; // degrees
const startAngle = -spreadAngle / 2;
const angleStep = spreadAngle / (totalCards - 1);
const rotation = startAngle + (angleStep * index);

// Responsive radius
const baseRadius = window.innerWidth < 640 ? 150 :
                   window.innerWidth < 768 ? 180 : 220;

const translateX = Math.sin((rotation * Math.PI) / 180) * baseRadius;
const translateY = -Math.abs(Math.cos((rotation * Math.PI) / 180)) * 55;
```

**The result:** All 78 cards arranged in a beautiful fan that responds to screen size!

#### Interactive Card Selection

```tsx
<button
  onClick={() => canSelect && selectCard(index)}
  style={{
    transform: `translateX(${translateX}px)
                translateY(${translateY}px)
                rotate(${rotation}deg)
                ${isSelected ? 'scale(0)' : 'scale(1)'}`,
    zIndex: totalCards - Math.abs(index - totalCards / 2)
  }}
  className={`
    hover:scale-150 hover:z-[1000]
    transition-all duration-300
    ${canSelect
      ? 'cursor-pointer shadow-lg hover:shadow-2xl'
      : 'cursor-not-allowed opacity-30'
    }
  `}
>
  <img src="/images/cards/cardback.jpg" alt="Card back" />
</button>
```

**Key features:**
- ✨ Smooth animations on hover
- 🎯 Cards scale up when hovered
- 🎨 Selected cards smoothly disappear
- 📱 Touch-friendly on mobile

### 10:00 AM - Dynamic Spread Layouts

Different tarot spreads need different layouts. I built a flexible system:

```typescript
// spreads.json - Configuration driven
{
  "id": "celtic-cross",
  "name": "Celtic Cross",
  "cardCount": 10,
  "layout_type": "CelticCross",
  "layout_grid": [6, 4],
  "positions": [
    { "position": 1, "name": "Present", "description": "..." },
    { "position": 2, "name": "Challenge", "description": "..." }
  ]
}
```

```tsx
// SpreadLayout.tsx - Render different layouts
const renderLayout = () => {
  switch (layout_type) {
    case 'Line':
      return <div className="flex flex-row gap-4">...</div>;

    case 'Grid':
      return layout_grid.map(rowCount => (
        <div className="flex flex-row gap-4">
          {Array.from({ length: rowCount }).map(...)}
        </div>
      ));

    case 'CelticCross':
      return (
        <div className="flex md:flex-row">
          {/* Cross formation */}
          <div className="grid grid-cols-3 grid-rows-3">...</div>
          {/* Staff (vertical line) */}
          <div className="flex flex-col">...</div>
        </div>
      );
  }
};
```

**Supported spreads:**
- 1-Card (Daily Card)
- 3-Card (Past-Present-Future)
- 5-Card (Relationship)
- 7-Card (Horseshoe)
- 10-Card (Celtic Cross)
- And many more!

---

## The Mobile CSS Challenge

### 12:00 PM - The Crisis

At midday, I tested on my phone and... **disaster**. The beautiful fan spread was completely broken:
- Cards overlapping
- Buttons too small to tap
- Text overflowing containers
- Shuffle button hidden off-screen

### 1:00 PM - The Fix Marathon

I spent the next few hours systematically fixing mobile issues:

#### Issue 1: Card Sizes Too Small

```css
/* Before */
.card {
  width: 80px;
  height: 120px;
}

/* After - Responsive sizing */
.card {
  @apply w-12 h-18 sm:w-14 sm:h-20 md:w-20 md:h-32;
}
```

#### Issue 2: Fan Spread Math Breaking on Small Screens

```typescript
// Responsive radius based on viewport
const baseRadius = typeof window !== 'undefined' && window.innerWidth < 640 ? 150 :
                   typeof window !== 'undefined' && window.innerWidth < 768 ? 180 :
                   220;
```

#### Issue 3: Text Truncation

```tsx
{/* Position names truncate instead of wrapping */}
<p className="text-[10px] sm:text-xs truncate max-w-[70px] sm:max-w-[90px]">
  {positionInfo.name}
</p>
```

#### Issue 4: Touch Targets Too Small

Apple's Human Interface Guidelines recommend **44×44pt minimum**. I ensured all interactive elements met this:

```tsx
<button className="min-h-[44px] min-w-[44px] px-4 py-2">
  Shuffle
</button>
```

#### Issue 5: Result Page Layout

The result page needed a complete mobile redesign:

```tsx
{/* Card display - stack on mobile, side-by-side on desktop */}
<div className="flex flex-col md:flex-row gap-6">
  {/* Card image */}
  <div className="md:w-48 flex-shrink-0">
    <img className={`${item.reversed ? 'rotate-180' : ''}`} />
  </div>

  {/* Card meaning */}
  <div className="flex-1">
    <h3 className="text-2xl">{item.card.name}</h3>
    <p className="text-sm">{item.card.upright.short}</p>
  </div>
</div>
```

### 3:00 PM - Mobile Testing Victory

After hours of tweaking, the mobile experience was **perfect**:
- ✅ Smooth card selection
- ✅ Readable text at all sizes
- ✅ Touch-friendly buttons
- ✅ Beautiful layouts on iPhone and Android
- ✅ Works great in portrait and landscape

---

## Enhancing User Experience

### The Question & Position System

One feature I'm particularly proud of: contextual readings based on user questions.

```typescript
// Each spread position has a specific meaning
{
  "position": 1,
  "name": "Past Influences",
  "description": "What past experiences are affecting your situation?"
}
```

Combined with the user's question (stored in local storage), each card interpretation becomes deeply personal:

```typescript
// In the result page, we show:
// 1. User's question
// 2. Position meaning
// 3. Card drawn
// 4. Card interpretation (upright or reversed)
// 5. Contextual meaning (work, love, health, spirituality)
```

### Progress Indicator

Users need feedback as they select cards:

```tsx
<div className="w-full bg-gray-200 rounded-full h-3">
  <div
    className="bg-gradient-to-r from-violet-deep to-gold-soft h-full transition-all duration-500"
    style={{ width: `${(selectedCards.length / cardCount) * 100}%` }}
  />
</div>
```

### Shuffling Animation

The shuffle animation needed to feel **magical**:

```tsx
{isShuffling && (
  <div className="relative w-48 h-48 mx-auto">
    {/* 8 spinning cards at different speeds */}
    {[...Array(8)].map((_, i) => (
      <div
        className="absolute inset-0 animate-spin-slow"
        style={{
          animationDelay: `${i * 0.15}s`,
          opacity: 0.7 - i * 0.08,
          transform: `rotate(${i * 45}deg)`
        }}
      >
        <div className="w-20 h-32 bg-gradient-to-br from-violet-900 to-purple-800 rounded-lg" />
      </div>
    ))}

    {/* Pulsing crystal ball in center */}
    <div className="absolute inset-0 flex items-center justify-center animate-pulse">
      <div className="text-6xl">🔮</div>
    </div>
  </div>
)}
```

---

## Custom Theme System

### Tailwind 4 Custom Colors

I created a mystical color palette that feels authentic to tarot:

```css
/* global.css */
@theme {
  --color-violet-deep: #2c1a47;      /* Deep mystic purple */
  --color-violet-medium: #4a3366;    /* Medium purple */
  --color-violet-light: #6b4d94;     /* Light purple */
  --color-gold-soft: #d4af37;        /* Soft gold accent */
  --color-gold-light: #e6c968;       /* Light gold */
  --color-off-white: #faf8f5;        /* Warm off-white */
  --color-navy: #1a1a3e;             /* Deep navy */

  /* Typography */
  --font-family-heading: "Cinzel", serif;  /* Elegant headings */
  --font-family-body: "Inter", sans-serif; /* Clean body text */
}
```

### Custom Animations

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.6s ease-out forwards;
}
```

### Accessibility

```css
/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Deployment & Final Touches

### 4:00 PM - Netlify Deployment

Deploying to Netlify was remarkably smooth:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Link project
netlify init

# Deploy
netlify deploy --prod
```

The Astro + Netlify integration handled everything:
- ✅ Automatic builds on push
- ✅ Edge functions for SSR
- ✅ CDN distribution
- ✅ HTTPS out of the box

### SEO Optimization

```astro
---
// Layout.astro - SEO meta tags
const { title, description, noindex } = Astro.props;
---
<head>
  <title>{title} | Tarot by the Stars</title>
  <meta name="description" content={description} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  {noindex && <meta name="robots" content="noindex, nofollow" />}

  {/* Sitemap */}
  <link rel="sitemap" href="/sitemap-index.xml" />
</head>
```

**Key SEO decisions:**
- ✅ Reading result pages are `noindex` (private)
- ✅ Card library pages are indexed (valuable content)
- ✅ Dynamic sitemap generation
- ✅ Semantic HTML throughout

### Performance Metrics

After deployment, I ran Lighthouse tests:

```
Performance:  98/100 ⚡
Accessibility: 100/100 ♿
Best Practices: 100/100 ✅
SEO: 100/100 🔍
```

**Why so fast?**
- Minimal JavaScript (only for card selection)
- Optimized images
- Tailwind CSS purging
- Astro's zero-JS-by-default approach

---

## Lessons Learned

### What Went Right ✅

1. **Astro was the perfect choice** - Islands architecture meant fast loads and great DX
2. **URL-based state is elegant** - No database complexity, infinite scalability
3. **Tailwind 4 is fantastic** - The new CSS variables system made theming a joy
4. **Mobile-first matters** - Catching mobile issues early saved hours later
5. **TypeScript everywhere** - Caught so many bugs before runtime

### What I'd Do Differently 🤔

1. **Start with mobile design** - I designed desktop-first and paid for it
2. **Component library** - I should have created a design system upfront
3. **Testing earlier** - I manually tested everything at the end (should have used Playwright)
4. **Image optimization** - Card images could be further compressed
5. **Progressive enhancement** - The card deck should work without JavaScript

### Technical Challenges Overcome 💪

1. **CSS Transform Math** - Getting the fan spread perfect took trigonometry skills
2. **React Hydration** - Ensuring smooth client-side takeover from Astro
3. **Responsive Typography** - Finding the right breakpoints for readability
4. **Z-index Hell** - Managing layers in the card fan
5. **Touch vs. Mouse Events** - Making interactions work on all devices

---

## What's Next

### Short-term Improvements 🎯

- [ ] Add tarot journal (save readings with notes)
- [ ] Implement image export for sharing (html2canvas)
- [ ] Search functionality in card library
- [ ] More spread types (12-card, zodiac spread)
- [ ] Dark mode toggle

### Long-term Vision 🌟

- [ ] Daily card notifications (optional)
- [ ] Guided interpretations (AI-assisted)
- [ ] Community spread templates
- [ ] Multi-language support
- [ ] Accessibility improvements (screen reader optimization)

---

## Technical Deep Dives

### Data Structure: Cards JSON

Each of the 78 tarot cards is stored with rich metadata:

```json
{
  "id": 0,
  "name": "The Fool",
  "slug": "the-fool",
  "arcana": "major",
  "suit": null,
  "image": "/images/cards/major/00-fool.jpg",
  "keywords": ["New beginnings", "Innocence", "Adventure"],
  "upright": {
    "short": "New beginnings, optimism, trust in life",
    "general": "The Fool represents...",
    "love": "In love readings...",
    "work": "Career-wise...",
    "health": "Health interpretation...",
    "spirituality": "Spiritual meaning..."
  },
  "reversed": {
    "short": "Recklessness, risk-taking, inconsideration",
    "general": "Reversed, The Fool suggests...",
    "love": "Reversed love meaning...",
    "work": "Reversed career meaning...",
    "health": "Reversed health meaning...",
    "spirituality": "Reversed spiritual meaning..."
  }
}
```

### Spread Configuration System

Spreads are completely data-driven:

```json
{
  "id": "celtic-cross",
  "name": "Celtic Cross",
  "description": "The most popular spread for deep insight",
  "cardCount": 10,
  "layout_type": "CelticCross",
  "layout_grid": [6, 4],
  "positions": [
    {
      "position": 1,
      "name": "Present Situation",
      "description": "Your current state of being",
    }
  ]
}
```

This makes adding new spreads trivial—just add a JSON entry!

---

## Code Snippets Worth Sharing

### Custom Hook: useLocalStorage

```typescript
// src/utils/storage.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
}
```

### Responsive Card Component

```tsx
function CardSlot({ card, cardData, positionInfo, index }: CardSlotProps) {
  const hasCard = !!card;

  return (
    <div className="flex flex-col items-center gap-1 md:gap-2">
      {hasCard ? (
        <div className="animate-fadeIn">
          <div
            className={`
              w-[70px] h-[105px]
              sm:w-[90px] sm:h-[135px]
              md:w-[110px] md:h-[165px]
              rounded-lg shadow-xl border-2
              ${card.reversed ? 'rotate-180' : ''}
            `}
          >
            <img src={cardData.image} alt={cardData.name} />
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-violet-100 to-violet-200">
          <span className="text-xl">?</span>
        </div>
      )}
    </div>
  );
}
```

---

## Performance Optimizations

### Image Loading Strategy

```astro
---
// Lazy load card images
---
<img
  src={card.image}
  alt={card.name}
  loading="lazy"
  decoding="async"
  class="w-full h-full object-cover"
/>
```

### Code Splitting

Astro automatically code-splits React components:

```astro
---
import CardDeckWrapper from '../components/CardDeckWrapper';
---

{/* Only loads React when component is visible */}
<CardDeckWrapper client:load cardCount={spread.cardCount} />
```

### CSS Optimization

Tailwind automatically purges unused styles in production:

```typescript
// Only the classes actually used are included
// Result: ~8KB CSS (instead of 3MB+)
```

---

## Conclusion

Building TarotFree in a single day was an incredible journey. From the morning brainstorming session to choosing Astro, fighting CSS battles on mobile, implementing cryptographic randomness, and finally deploying to Netlify—every moment taught me something new.

**Final Stats:**
- ⏱️ **Development Time:** ~5 hours (start 6:30 AM - 4:30 PM)
- 📝 **Lines of Code:** ~2,500
- 🎴 **Cards Implemented:** 78 (full Rider-Waite deck)
- 🔮 **Spreads Available:** 15+
- ⚡ **Lighthouse Score:** 98/100
- 💰 **Total Cost:** $0 (free hosting on Netlify)

The result is a fast, beautiful, and private tarot reading experience that respects users' data and provides genuine value. No ads, no tracking, no nonsense—just cards and contemplation.

Whether you're a developer looking to build something similar, or just curious about the technical journey behind a web app, I hope this deep dive was valuable. The combination of Astro, React, and Tailwind proved to be an excellent choice for this content-rich, interaction-light application.

**Live Site:** https://tarotfree.netlify.app
**Tech Stack:** Astro + React + TypeScript + Tailwind CSS 4 + Netlify

---

## Resources & References

- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Rider-Waite Tarot](https://en.wikipedia.org/wiki/Rider%E2%80%93Waite_Tarot)
- [Fisher-Yates Shuffle Algorithm](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)

---

*Written with ♥ by a developer who believes in both technology and mystery.*

**Tags:** #WebDevelopment #Astro #React #TypeScript #TailwindCSS #TarotReading #OneDay Project
