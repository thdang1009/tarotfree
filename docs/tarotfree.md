# PRD – Free Tarot Reading Web App (Frontend Only)

## Overview
Static, zero-backend web app for free, ad-free tarot readings.
All logic and data handled in the frontend.
No API calls, no login, no database — only static files + LocalStorage.

**Recommended Framework:** Astro (with React/Svelte islands for interactivity) or Next.js (SSG mode).
**Why:** SEO-optimized static pages + interactive components where needed.
**Data:** Tarot cards and spreads stored in JSON.

---

## PAGE 1 — Home / Spread Selection

### Layout
```
Header
 ├── Logo or Title: "Tarot by the Stars" (or custom brand name)
 └── Subtitle: "Free, private tarot readings — no ads, no login."

Main Section
 ├── Question Prompt: "What do you wish to understand today?"
 ├── Suggested Topics (buttons):
 │   - ❤️ Love
 │   - 💼 Career
 │   - 🔮 Future
 │   - ☀️ Daily Card
 ├── Divider or gentle animation (floating cards / stars)
 ├── Spread Selection (grid cards):
 │   - 1-Card: "Quick Daily Guidance"
 │   - 3-Card: "Past – Present – Future"
 │   - 5-Card: "Deeper Insights"
 │   (Each item shows name, card count, and short description)
 └── [Start Reading] button (hover glow)

Footer
 ├── "About Tarot"
 ├── "Disclaimer"
 └── Social/Portfolio Links (optional)
```

### Behavior
- Clicking a spread navigates to `/reading?spread=3` (use client-side routing if using Astro/Next.js).
- **SEO Requirements:**
  - Semantic HTML (`<h1>`, `<nav>`, `<main>`, `<footer>`)
  - Meta tags: title, description, Open Graph tags
  - Schema.org markup for WebApplication
- Light parallax background or starfield animation (CSS-based for performance).
- Keep colors calm (dark violet, deep navy, muted gold).

---

## PAGE 2 — Reading (Shuffle + Select Cards)

### Layout
```
Header
 ├── "Your Reading – 3 Cards Spread"
 └── Hint: "Focus your mind and choose your cards."

Main Section
 ├── Deck Area
 │   - Shuffling animation (cards stack or scatter)
 │   - Button: [Shuffle Again]
 │   - Optional "Cut the Deck" effect
 ├── Card Selection
 │   - User clicks cards to choose N (based on spread)
 │   - Selected cards animate to positions
 └── [Reveal Cards] button
```

### Behavior
- Use crypto.getRandomValues() for better randomness (not Math.random()).
- Card selection limited by spread type (prevent selecting more than allowed).
- **Accessibility:** Keyboard navigation for card selection (Tab + Enter/Space).
- Subtle ambient sound optional (muted by default, with toggle button).
- **Note:** This page should be client-side interactive (Astro island or Next.js dynamic component).

---

## PAGE 3 — Reading Result / Interpretation

### Layout
```
Header
 ├── "Your Reading Result"
 └── Subtext: "Reflect on each card's meaning below."

Main Section
 ├── Display Spread Layout
 │   - Show all drawn cards in order (1–3–5 etc.)
 │   - Each card has:
 │       - Card image (optimized, lazy-loaded)
 │       - Card name
 │       - Upright/Reversed indicator
 │       - Short meaning (1–2 lines)
 │       - Expand button → detailed interpretation
 ├── Summary Box
 │   - Combined reading meaning
 │   - Key insight or advice
 └── Action Buttons
     - [Download as Image]
     - [Copy Link] (shareable URL with reading state)
     - [New Reading]
```

### Behavior
- Use `html2canvas` or modern Canvas API to generate downloadable PNG.
- **Shareable Links:** Encode reading results in URL hash/query params (e.g., `?cards=0-15-42&reversed=0-1-0`).
- Reading data saved to LocalStorage for "Recent Readings" feature (optional).
- **SEO Note:** Use `robots: noindex` for result pages (prevent duplicate content).
- Optional: inspirational quote at bottom ("Tarot reflects your inner world.").

---

## PAGE 4 — Card Library (Reference)

### Layout
```
Header
 ├── "Tarot Card Meanings"
 └── Search bar: [Search by name or keyword]
 └── Filter: [All | Major Arcana | Wands | Cups | Swords | Pentacles]

Main Section
 ├── Card Grid (responsive: 2-3-4 columns)
 │   - Each card tile shows:
 │       - Thumbnail (optimized images)
 │       - Card name
 │       - Short meaning
 │   - Click → open modal/detail page with full info:
 │       - Full-size image
 │       - Upright meaning
 │       - Reversed meaning
 │       - Keywords
 │       - Advice
Footer
 └── "Based on Rider–Waite Tarot Deck (Public Domain)"
```

### Behavior
- All data loaded from `cards.json` (pre-fetched during build for SSG).
- Client-side fuzzy search using Fuse.js or simple string matching.
- **SEO Optimization:**
  - Each card can have its own static page: `/cards/the-fool`, `/cards/the-magician`
  - Rich snippets with card meanings
  - Internal linking between related cards
- Filter by suit/arcana with URL params for shareability.

---

## PAGE 5 — About / Disclaimer

### Layout
```
Header
 ├── "About This Site"

Content
 ├── Short text about tarot's purpose: introspection, not prediction.
 ├── Credit deck source (e.g., Rider–Waite, public domain).
 ├── Privacy statement: "No data is collected or stored on servers."
 ├── Link: [Your Blog or Portfolio]
 ├── Optional: [Support / Buy Me a Coffee]
 └── Disclaimer box:
     "This site is for entertainment, reflection, and spiritual insight only.
      Not a substitute for professional advice (legal, medical, financial)."
```

---

## SYSTEM BEHAVIOR

### Random Card Logic
```js
// Use crypto.getRandomValues() for better randomness
function shuffleDeck(cards) {
  const array = [...cards];
  const randomValues = new Uint32Array(array.length);
  crypto.getRandomValues(randomValues);

  for (let i = array.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Randomly decide upright/reversed (50/50)
function isReversed() {
  return crypto.getRandomValues(new Uint8Array(1))[0] > 127;
}
```

### Reading Limit System (Optional)
```js
// LocalStorage structure:
// { readings: [timestamp1, timestamp2, ...], limit: 3 }

const READING_LIMIT = 3;
const RESET_HOURS = 24;

function canDoReading() {
  const data = JSON.parse(localStorage.getItem('readings') || '{"readings":[]}');
  const now = Date.now();
  const cutoff = now - (RESET_HOURS * 60 * 60 * 1000);

  // Remove old readings
  data.readings = data.readings.filter(ts => ts > cutoff);

  if (data.readings.length >= READING_LIMIT) {
    const oldestReading = Math.min(...data.readings);
    const resetTime = oldestReading + (RESET_HOURS * 60 * 60 * 1000);
    const hoursLeft = Math.ceil((resetTime - now) / (60 * 60 * 1000));
    return { allowed: false, hoursLeft };
  }

  return { allowed: true };
}
```
**Note:** Consider making this optional or generous (5-10 readings/day) to improve UX.

### Offline / Caching
```
- Use Service Worker or configure framework's built-in caching:
  - Next.js: automatic static asset caching
  - Astro: use @astrojs/service-worker or Workbox
- Cache strategy:
  - Static assets: cache-first
  - Card images: cache-first with fallback
  - JSON data: network-first with cache fallback
- PWA manifest.json for "Add to Home Screen" functionality
```

### Analytics (Privacy-First)
```
Recommended privacy-friendly options:
1. Plausible Analytics (cookieless, GDPR-compliant)
   - Lightweight script (~1KB)
   - Track: page views, spread selections, card library searches

2. Umami (self-hosted or cloud)
   - Open source, privacy-focused
   - No cookies, respects Do Not Track

3. Cloudflare Web Analytics (if using CF Pages)
   - Free, privacy-preserving
   - Basic metrics only

Avoid: Google Analytics (privacy concerns, bloated script)
```

---

## FILE STRUCTURE

### Option A: Astro (Recommended for SEO + Performance)
```
/src
  ├── /pages
  │   ├── index.astro              → Home (100% static)
  │   ├── reading.astro            → Reading process (interactive island)
  │   ├── result.astro             → Display result
  │   ├── cards/
  │   │   ├── index.astro          → Card library main page
  │   │   └── [slug].astro         → Individual card pages (SEO boost!)
  │   └── about.astro              → About & disclaimer
  ├── /components
  │   ├── CardDeck.tsx             → Interactive card selection (React/Svelte)
  │   ├── SpreadDisplay.tsx        → Result display component
  │   ├── SearchBar.tsx            → Card search with fuzzy matching
  │   └── Layout.astro             → Shared layout with SEO meta
  ├── /data
  │   ├── spreads.json             → Spread definitions
  │   └── cards.json               → Card meanings (78 cards)
  ├── /utils
  │   ├── rng.ts                   → Crypto-based randomness
  │   ├── storage.ts               → LocalStorage helpers
  │   └── image-export.ts          → Canvas export for sharing
  └── /assets
      ├── /images/cards/           → Optimized tarot card images
      └── /styles/global.css       → Tailwind + custom CSS

/public
  ├── manifest.json                → PWA manifest
  └── robots.txt                   → SEO configuration
```

### Option B: Next.js (Alternative, good for React devs)
```
/app
  ├── layout.tsx                   → Root layout with metadata
  ├── page.tsx                     → Home page
  ├── reading/page.tsx             → Reading process
  ├── result/page.tsx              → Result display
  ├── cards/
  │   ├── page.tsx                 → Card library
  │   └── [slug]/page.tsx          → Individual card pages
  └── about/page.tsx               → About page

/components
  ├── CardDeck.tsx
  ├── SpreadDisplay.tsx
  └── SearchBar.tsx

/lib
  ├── data/
  │   ├── spreads.json
  │   └── cards.json
  └── utils/
      ├── rng.ts
      ├── storage.ts
      └── image-export.ts

/public
  ├── images/cards/
  └── manifest.json

next.config.js → Configure: output: 'export' for static build
```

---

## UI STYLE GUIDE

### Color Palette
- **Primary:** Deep violet `#2c1a47` (backgrounds, headers)
- **Accent:** Soft gold `#d4af37` (buttons, highlights)
- **Background:** Off-white `#faf8f5` (main content)
- **Text:** Dark charcoal `#1a1a1a` / white `#ffffff`
- **Gradients:** Violet-to-navy for hero sections

### Typography
- **Headings:** Serif or calligraphic fonts
  - "Cinzel" (Google Fonts) - elegant, mystical
  - "Crimson Text" - readable serif
- **Body:** Sans-serif for readability
  - "Inter" or "Open Sans"
- **Font sizes:** Responsive (clamp() or Tailwind responsive classes)

### Animations (Performance-First)
- Use CSS transitions/animations (not heavy JS libraries)
- Subtle fade-in/fade-out (opacity + transform)
- Floating/parallax effects with `transform: translate3d()` for GPU acceleration
- Optional: Framer Motion or GSAP for complex card animations
- **Respect `prefers-reduced-motion`** for accessibility

### Components
- **Buttons:** Rounded corners (8-12px), subtle glow on hover, smooth transitions
- **Cards:** Shadow elevations, hover lift effect
- **Inputs:** Clean borders, focus rings with accent color
- **Modals:** Backdrop blur, centered, smooth slide-in

### Tone
- Calm, mystical, trustworthy
- Avoid aggressive colors or excessive animations
- Focus on creating a peaceful, reflective atmosphere

---

## MVP CHECKLIST

### Phase 1: Core Functionality
- [ ] Project setup (Astro/Next.js + Tailwind CSS)
- [ ] Create `cards.json` with all 78 tarot cards (meanings, keywords)
- [ ] Create `spreads.json` with spread definitions
- [ ] Home page with spread selection (static, SEO-optimized)
- [ ] About/disclaimer page (static)

### Phase 2: Reading Experience
- [ ] Card shuffling algorithm (crypto.getRandomValues)
- [ ] Interactive card selection UI
- [ ] Reading result display with card interpretations
- [ ] Upright/reversed logic
- [ ] LocalStorage reading limit system (optional)

### Phase 3: Card Library
- [ ] Card library grid view
- [ ] Search functionality (fuzzy search)
- [ ] Filter by suit/arcana
- [ ] Individual card detail pages (for SEO)

### Phase 4: Sharing & Polish
- [ ] Image export (html2canvas or Canvas API)
- [ ] Shareable reading URLs (URL params)
- [ ] Responsive design (mobile-first)
- [ ] Accessibility (keyboard navigation, ARIA labels)
- [ ] Performance optimization (image optimization, lazy loading)

### Phase 5: Deployment
- [ ] SEO meta tags (title, description, OG tags)
- [ ] Schema.org markup
- [ ] robots.txt & sitemap.xml
- [ ] PWA manifest (optional)
- [ ] Deploy to GitHub Pages / Cloudflare Pages / Netlify

---

## OPTIONAL FUTURE FEATURES (Post-MVP)

### v2.0 Ideas
- **Multilingual support (VN/EN):** Use i18n library (next-i18next or Astro i18n)
- **AI-generated reading summaries:** Integrate OpenAI/Anthropic API for personalized insights
- **Reading journal:** Save and review past readings (with user accounts or export to JSON)
- **Daily card notification:** PWA push notifications for daily guidance
- **Advanced spreads:** Celtic Cross, Tree of Life, custom layouts
- **Card relationship analysis:** Show connections between cards in spread
- **Dark mode toggle:** System preference detection + manual override
- **Social sharing:** Pre-generated share images for social media
- **Gamification:** Daily streaks, achievement badges for consistent readings
- **Blog integration:** Embed tarot widget on main site
- **Voice reading:** Text-to-speech for card interpretations (accessibility)
- **Animation upgrades:** Card flip animations, particle effects

---

## DEPLOYMENT

### Recommended Hosting Platforms (Free Tier)

**1. Cloudflare Pages** (Best overall)
- ✅ Unlimited bandwidth
- ✅ 500 builds/month
- ✅ Global CDN
- ✅ Built-in analytics option
- ✅ Custom domains with SSL
- ✅ Fast builds (supports Astro/Next.js)
- 🔧 Deploy: Connect GitHub repo → Auto-deploy on push

**2. Netlify**
- ✅ 100GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Form handling (useful for contact forms)
- ✅ Serverless functions (for future features)
- ✅ Preview deployments
- 🔧 Deploy: Drag-and-drop or GitHub integration

**3. GitHub Pages**
- ✅ Free for public repos
- ✅ Custom domains
- ⚠️ Requires static export (no server-side features)
- ⚠️ 1GB storage limit
- 🔧 Deploy: Use GitHub Actions for automated builds

**4. Vercel** (Next.js optimized)
- ✅ Best for Next.js projects
- ✅ 100GB bandwidth/month
- ✅ Edge functions
- ⚠️ Commercial use requires paid plan
- 🔧 Deploy: Vercel CLI or GitHub integration

### Domain Setup (Optional)
- Use custom domain: `tarot.yourdomain.com` or `tarotbythestars.com`
- Free alternatives: `username.github.io/tarot` or `tarot.pages.dev`

### CI/CD Pipeline
```yaml
# Example: GitHub Actions for Astro
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## SEO OPTIMIZATION CHECKLIST

### On-Page SEO
- [ ] Unique `<title>` for each page (50-60 characters)
- [ ] Meta descriptions (150-160 characters)
- [ ] Open Graph tags (og:title, og:description, og:image)
- [ ] Twitter Card tags
- [ ] Semantic HTML5 (`<header>`, `<main>`, `<article>`, `<footer>`)
- [ ] Alt text for all images
- [ ] Internal linking between pages
- [ ] Fast load times (Lighthouse score >90)

### Technical SEO
- [ ] `robots.txt` allowing search engines
- [ ] `sitemap.xml` generated (use framework plugins)
- [ ] Schema.org markup (WebApplication type)
- [ ] Mobile-friendly (responsive design)
- [ ] HTTPS enabled
- [ ] Canonical URLs set
- [ ] No broken links (404 pages)

### Content SEO
- [ ] Individual pages for each tarot card (78 pages!)
- [ ] Rich content: card meanings, keywords, interpretations
- [ ] Blog posts (optional): "How to read tarot", "Tarot spread guides"
- [ ] FAQ page (optional)

---

## TECHNICAL RECOMMENDATIONS SUMMARY

### Framework Choice: **Astro** 🏆
**Why Astro is best for this project:**
1. **SEO Excellence:** Generates 100% static HTML by default
2. **Performance:** Ships zero JavaScript by default, only hydrates interactive components
3. **Developer Experience:** Write components in React, Svelte, or Vue (your choice)
4. **Perfect fit:** Static pages (home, about, card library) + interactive islands (card reading)
5. **Built-in optimizations:** Image optimization, automatic sitemap generation
6. **Easy deployment:** Works seamlessly with all static hosts

**Alternative: Next.js**
- Choose if you prefer React-only development
- Use with `output: 'export'` for static generation
- Great ecosystem for future backend features

### Tech Stack Recommendations
```
Framework:     Astro 4.x
Styling:       Tailwind CSS 3.x
Interactivity: React/Svelte islands (your preference)
Animations:    CSS transitions + Framer Motion (optional)
Search:        Fuse.js (fuzzy search)
Analytics:     Plausible or Cloudflare Analytics
Hosting:       Cloudflare Pages (recommended)
```

### Key SEO Wins
1. **78 static card pages** → Each card has its own URL and meta tags
2. **Fast load times** → Astro's zero-JS approach = Lighthouse 100/100
3. **Semantic HTML** → Better crawlability for search engines
4. **Internal linking** → Card relationships create strong SEO network

### Development Timeline (Estimate)
- **Week 1-2:** Setup, data preparation (cards.json), basic pages
- **Week 3:** Interactive reading flow, card selection logic
- **Week 4:** Card library, search, individual card pages
- **Week 5:** Polish, accessibility, SEO optimization, deployment

---
