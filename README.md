# 🔮 Tarot by the Stars

A free, privacy-focused tarot reading web app built with Astro. No ads, no login, no data collection - just pure tarot guidance.

![Astro](https://img.shields.io/badge/Astro-5.x-FF5D01?logo=astro&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?logo=tailwind-css&logoColor=white)
![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

- 🎴 **Multiple Spreads**: Daily card, 3-card, and 5-card spreads
- 🎨 **Beautiful UI**: Mystical design with violet and gold theme
- ⚡ **Lightning Fast**: Static site generation with Astro
- 🔒 **Privacy First**: No server-side data storage, all readings are private
- 📱 **Responsive**: Works perfectly on mobile and desktop
- ♿ **Accessible**: Keyboard navigation and ARIA labels
- 🎯 **SEO Optimized**: Individual pages for each tarot card
- 🚫 **No Ads**: Clean, distraction-free experience

## 🚀 Quick Start

### Prerequisites

- Node.js 18.20.8 or higher
- npm 9.6.5 or higher

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to `http://localhost:4321`

### Build for Production

```bash
npm run build
```

The static files will be generated in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
/
├── public/              # Static assets (images, favicon, etc.)
├── src/
│   ├── assets/         # Optimized images
│   │   └── images/cards/  # Tarot card images
│   ├── components/     # React/Astro components
│   ├── data/
│   │   ├── cards.json     # Tarot card data (78 cards)
│   │   └── spreads.json   # Spread definitions
│   ├── layouts/
│   │   └── Layout.astro   # Base layout with SEO
│   ├── pages/
│   │   ├── index.astro    # Home page
│   │   ├── about.astro    # About page
│   │   ├── reading.astro  # Reading page
│   │   ├── result.astro   # Result page
│   │   └── cards/
│   │       ├── index.astro   # Card library
│   │       └── [slug].astro  # Individual card pages
│   ├── styles/
│   │   └── global.css     # Tailwind + custom styles
│   └── utils/
│       ├── rng.ts         # Crypto-based randomness
│       └── storage.ts     # LocalStorage helpers
├── astro.config.mjs    # Astro configuration
└── package.json
```

## 🎨 Customization

### Update Site Title & Branding

Edit `src/layouts/Layout.astro`:
```astro
const siteTitle = "Your Custom Name";
```

### Customize Colors

Edit `src/styles/global.css`:
```css
@theme {
  --color-violet-deep: #2c1a47;  /* Change primary color */
  --color-gold-soft: #d4af37;    /* Change accent color */
}
```

### Update Domain

Edit `astro.config.mjs`:
```js
export default defineConfig({
  site: 'https://yourdomain.com',
  // ...
});
```

## 📦 Adding Tarot Cards

The project currently includes 3 sample cards. To add all 78 cards:

1. Edit `src/data/cards.json`
2. Add card entries following this structure:

```json
{
  "id": 0,
  "name": "The Fool",
  "slug": "the-fool",
  "arcana": "major",
  "suit": null,
  "keywords": ["new beginnings", "innocence"],
  "upright": {
    "short": "Brief meaning",
    "detailed": "Detailed interpretation"
  },
  "reversed": {
    "short": "Brief reversed meaning",
    "detailed": "Detailed reversed interpretation"
  },
  "image": "/images/cards/00-fool.jpg"
}
```

3. Add corresponding images to `public/images/cards/`

## 🚢 Deployment

### Cloudflare Pages (Recommended)

1. Push your code to GitHub
2. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
3. Connect your repository
4. Set build command: `npm run build`
5. Set output directory: `dist`
6. Deploy!

### Netlify

1. Push your code to GitHub
2. Go to [Netlify](https://app.netlify.com/)
3. Import your repository
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Deploy!

### GitHub Pages

```bash
npm run build
# Push dist/ to gh-pages branch
```

## 🧪 Tech Stack

- **Framework**: [Astro 5.x](https://astro.build/)
- **Styling**: [Tailwind CSS 4.x](https://tailwindcss.com/)
- **Interactivity**: [React 19.x](https://react.dev/)
- **Search**: [Fuse.js](https://fusejs.io/)
- **Image Export**: [html2canvas](https://html2canvas.hertzen.com/)

## 🧞 Commands

All commands are run from the root of the project:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 📝 Development Roadmap

### Phase 1: Core Functionality ✅
- [x] Project setup with Astro + Tailwind
- [x] Create data files (spreads.json, cards.json)
- [x] Home page with spread selection
- [x] About page
- [ ] Reading page (card selection)
- [ ] Result page (interpretation display)

### Phase 2: Card Library
- [ ] Card library grid view
- [ ] Search functionality
- [ ] Individual card pages (78 pages for SEO)
- [ ] Filter by suit/arcana

### Phase 3: Features
- [ ] Image export functionality
- [ ] Shareable reading URLs
- [ ] Reading limit system (LocalStorage)
- [ ] Recent readings history

### Phase 4: Polish
- [ ] Add all 78 tarot card data
- [ ] Optimize images
- [ ] PWA support (manifest.json, service worker)
- [ ] Accessibility audit

### Phase 5: Deployment
- [ ] Set up CI/CD
- [ ] Generate sitemap
- [ ] Deploy to production

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License. The Rider-Waite Tarot deck imagery is in the public domain.

## 🙏 Acknowledgments

- Rider-Waite Tarot deck (public domain)
- Astro framework and community
- All contributors and supporters

---

Made with ❤️ for the spiritual community
