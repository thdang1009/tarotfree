# Tarot by the Stars — Progress & Enhancement Roadmap

*Last updated: 2026-02-25*

---

## 1. What We've Already Built

### Core App (Phase 1 — Complete)
- **78-card Rider-Waite deck** fully loaded with images and multi-aspect meanings (General, Work, Love, Health, Spirituality — both Upright and Reversed)
- **15+ tarot spreads** (1-card through 10-card Celtic Cross) defined in `spreads.json` with dynamic layout engine in `SpreadLayout.tsx`
- **`/reading/[spreadId]`** — interactive page where user shuffles and draws cards from a fan-spread of all 78 cards (crypto-secure RNG)
- **`/result/[spreadId]/[cardIds]/[reversed]`** — SSR result page displaying the full spread, individual card meanings, and the Full Reading Synthesis
- **`/cards`** — browseable card library with Major/Minor Arcana filters
- **`/cards/[slug]`** — 78 static SEO-optimised individual card pages
- **URL-based state** — no database, entire reading encoded in path, shareable immediately
- **Netlify SSR deployment** — live at https://tarotfree.netlify.app

### UX Polish (Phase 2 — Complete)
- Beautiful shuffle animation (8 spinning cards + crystal ball emoji)
- Sequential card selection with progress bar
- `SpreadLayout.tsx` renders 15 layout types (Line, CelticCross, Diamond, Arch, Arrow, etc.)
- Shareable URL via clipboard copy
- Compact spread preview at top of `/result` page
- Reversed card icon (rotation arrow, not ⚠️ warning) — then reverted back to ⚠️ in result page (inconsistency to fix)

### Post-Launch Features Added
- **i18n** — full English / Vietnamese bilingual support (`/src/i18n/en|vi/`)
- **`FullReadingDisplay.tsx`** + **`readingAnalyzer.ts`** — rule-based synthesis engine that:
  - Detects dominant suit / Major Arcana count
  - Identifies supporting, challenging, complementary, and contradicting card pairs
  - Generates a 4-part narrative (opening → body → conclusion → advice)
- **`MysteryVoiceButton.tsx`** — floating TTS button that narrates the synthesis via Web Speech API (language-aware, hides if no voice available)
- **`LanguageSwitcher.tsx`** — client-side language switcher component
- **`textToSpeech.ts`** utility with polling fallback for browsers that drop `onend` events

---

## 2. Known Issues / Technical Debt

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| 1 | Image export button shows `alert()` placeholder | `result/[...params].astro` line 269 | Medium |
| 2 | Fuse.js installed but never integrated — card search missing | `/cards/index.astro` | Low |
| 3 | Reversed card icon is `⚠️` on the result page but neutral rotation arrow elsewhere | `result/[...params].astro` line 139 | Low |
| 4 | `readingAnalyzer.ts` contains hardcoded EN/VI strings inline — not using the i18n JSON files | `readingAnalyzer.ts` | Low |
| 5 | No reading history / journal | — | Low |
| 6 | No unit or E2E tests | — | Low |

---

## 3. What Should Be Done Next (Prioritised)

### High Priority
1. **Fix the `/reading` UX flow** — see Section 4 below, this is the biggest UX pain point
2. **Enhance Full Reading Synthesis** — see Section 5 below
3. **Implement image export** — replace the `alert()` with actual `html2canvas` → PNG download

### Medium Priority
4. **Integrate Fuse.js card search** on `/cards` page (already installed)
5. **Fix reversed icon inconsistency** — use the neutral rotation arrow everywhere
6. **Refactor hardcoded i18n strings** in `readingAnalyzer.ts` → move to JSON files

### Lower Priority
7. **Reading journal** — LocalStorage-based, show last 5–10 readings on homepage
8. **Dark mode toggle**
9. **PWA manifest + service worker** for offline support
10. **Analytics** (Plausible / Umami — privacy-friendly)

---

## 4. UX Problem: `/reading` Page Flow Is Backwards

### Current Flow
```
User lands on /reading/[spreadId]
  → Sees the card fan immediately
  → Picks cards (no context)
  → Only AFTER all cards are selected, position meanings appear below
  → Then navigates away to /result
```

**Problem:** The user is drawing cards before they understand *what each card slot means* or even *what question they are asking*. In a real tarot reading, you:
1. Set your intention / ask your question
2. Understand the spread positions
3. Then draw cards, knowing which slot each card fills

### Proposed New Flow (3-Step Wizard)

```
Step 1 — Intention  (new)
  User sees: Spread name + description
             Optional: "What is your question?" text input
             CTA: "I'm ready — shuffle the deck"

Step 2 — Draw Cards  (current, slightly refined)
  User sees: Spread position layout (static preview with named slots)
             Fan deck ready to draw from
             Progress: "Drawing card 2 of 3: PRESENT"  ← shows current slot name
             As each card is drawn, it animates into the correct position

Step 3 → redirect to /result (unchanged)
```

#### Why This Is Better
- User always knows *which slot* they're drawing for (current issue: you just pick cards blindly)
- The question is captured at the start so it can be passed to the synthesis engine properly
- The spread layout shown during drawing gives spatial/semantic context before the user picks
- Feels like a real tarot session — intention first, then draw

#### Implementation Sketch
- Replace `CardDeckWrapper` with a `ReadingWizard` component that has internal `step` state (1 = intention, 2 = draw)
- Step 1: static form with optional `<textarea>` for the question
- Step 2: current `CardDeck` but with an active-position highlight on `SpreadLayout` (CSS ring around the "current" slot)
- Pass `question` forward to the result URL as a query param (already supported: `?question=...`)
- The current `/reading/[spreadId].astro` already renders position descriptions below — move them into Step 1 so the user reads them *before* drawing

---

## 5. Enhancement: Full Reading Synthesis in `/result`

### What It Does Now
The `FullReadingDisplay` component renders a large block containing:
- Header + primary theme
- Opening paragraph (italicised)
- Reading Overview grid (energy, dominant suit, Major Arcana count, secondary themes)
- Interpretation body (2-4 paragraphs)
- Key Card Interactions (up to 3)
- Supporting / Challenging card lists (two columns)
- Outcome Influencers chips
- Conclusion + Advice (dark violet box)
- Disclaimer text
- `MysteryVoiceButton` (floating TTS)

### Problems with the Current Implementation

#### A. Content Quality
The `readingAnalyzer.ts` generates narrative via **template strings** — every positive reading sounds nearly identical. The user will notice after 2-3 readings that it's a fill-in-the-blank engine.

**Enhancement:** Add more template variety (at least 3 variants per energy type), include the actual card names and position names in the body paragraphs so it reads more personalised.

Example — current:
> "The cards reveal a promising path ahead. Your reading is illuminated by emotions, relationships, and intuition, suggesting opportunities for growth."

Example — improved:
> "The Star in your Past position speaks of healing already begun — you carry this light into the Present, where the Two of Cups reflects new emotional bonds forming. The Moon in your Future position asks you to trust the unknown."

#### B. Visual Hierarchy / Information Density
The section is too flat — everything has equal visual weight, making it hard to know what to read first.

**Proposed visual restructuring:**
```
┌─────────────────────────────────────────────┐
│  ✨ Full Reading Synthesis                   │  ← Large header (kept)
│  "Emotions, relationships, and intuition"    │  ← Subtitle theme
├─────────────────────────────────────────────┤
│  [Mood pill: 🌟 Positive energy]             │  ← Single coloured badge (new, compact)
│                                             │
│  Opening paragraph (italic, large text)      │  ← Kept, most prominent
├─────────────────────────────────────────────┤
│  📖 Your Story                              │  ← Rename "Interpretation" → "Your Story"
│  Paragraph 1...                             │
│  Paragraph 2...                             │
├─────────────────────────────────────────────┤
│  🌟 Card Conversations   (collapsible)       │  ← Rename "Key Card Interactions"
│  [interaction chips]                        │  ← More visual, less text
├─────────────────────────────────────────────┤
│  ✅ With you    ⚠️ Watch for               │  ← Keep 2-col layout, improve card display
│  (card thumbnail + name)                   │  ← Add tiny card image thumbnails
├─────────────────────────────────────────────┤
│  🎯 The Path Forward  (outcome influencers) │  ← Rename, make more prominent
├─────────────────────────────────────────────┤
│  🌙 Closing Message  (full-width dark box)  │  ← Keep, add a decorative divider above
│  Conclusion text                            │
│  ─────────────────────                     │
│  💫 Guidance                                │
│  Advice text                                │
└─────────────────────────────────────────────┘
```

#### C. Missing: Question Awareness
Currently the `opening` paragraph appends `In response to your question: "..."` at the end. This feels like an afterthought.

**Enhancement:** When a question is provided, show it prominently *inside* the synthesis box, before the opening, with a different visual treatment:
```
╔════════════════════════════════╗
║  🔮 Your Question              ║
║  "Will I find love this year?" ║
╚════════════════════════════════╝
```
Then the narrative can open *answering* that question more directly.

#### D. Add a "Reading at a Glance" Summary Row
Before the full narrative, add a compact 3-column stat row:

```
┌──────────────┬──────────────┬──────────────┐
│  3 Cups      │  2 Major     │  🌟 Positive  │
│  Dominant    │  Arcana      │  Energy      │
└──────────────┴──────────────┴──────────────┘
```

This gives users who don't want to read the full narrative an instant summary.

#### E. TTS / Mystery Voice — Discovery Problem
The floating `MysteryVoiceButton` is barely discoverable — it's a 64×64px circle in the bottom-right corner with no label.

**Enhancement:** Add a one-time inline prompt inside the synthesis box:
```
🎙️ Want to hear this reading? [Listen with Mystery Voice]
```
After clicked once, the floating button becomes the control. This replaces the current small italic hint text which is too easy to miss.

---

## 6. Additional Enhancements to Consider

### `/cards` Page — Search
Fuse.js is already installed. Wire it to a search input on the cards index page. ~30 minutes of work.

### Homepage — Recent Reading CTA
Show a "Continue your last reading →" link if LocalStorage has a saved result URL. Zero-backend personalisation.

### Result Page — Card Thumbnail Consistency
On mobile, card images in the individual card sections are `md:w-48` (shrinks on small screens). Make the image a fixed square thumbnail so it looks consistent regardless of orientation.

### Spread Preview on Homepage
Instead of just showing the spread name + card count, show a tiny SVG/CSS dot diagram of the actual spread layout. Users can visualise the Celtic Cross shape vs a simple 3-card line before clicking.

---

## 7. Architecture Notes

- All pages use `prerender = false` (SSR via Netlify) — language detection reads `Accept-Language` header
- i18n data lives in `src/i18n/{en|vi}/{common,spreads,cards,readings}.json`
- Card and spread data are loaded via `loadData.ts` which picks the right language file at request time
- `readingAnalyzer.ts` bypasses i18n JSON and has inline bilingual strings — should be refactored to use `createTranslator`
- The `question` param flows: `CardDeckWrapper` (captures nothing yet — **BUG**: question is not gathered at reading time) → URL `?question=` → result page → `FullReadingDisplay`

> **Critical note:** Currently there is NO UI to enter a question before drawing cards. The `question` param is theoretically supported in the result URL but is never populated. This is closely tied to the UX fix in Section 4.
