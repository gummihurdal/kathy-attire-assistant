# 👑 Kathy · Atelier Privé

> A royal-grade AI wardrobe assistant for Katherina. Photograph your wardrobe, receive expert outfit recommendations curated by Claude AI — styled by style direction, colour harmony, and occasion.

---

## ✦ Features

- **Wardrobe Upload** — Drag & drop photos of clothes, shoes, bags, accessories. AI auto-identifies and categorises each piece.
- **AI Outfit Generator** — 7 style directions (Casual, Smart Casual, Business, Formal, Sporty, Evening, Weekend). Claude composes complete looks from *your own wardrobe*.
- **Colour Harmony** — Every recommendation considers colour theory and seasonal palette.
- **Accessories & Shoes** — Specific recommendations for completing the look.
- **Personal Lookbook** — Save favourite outfits to your private style archive.
- **Stylist's Secrets** — Insider tips to elevate each look.

---

## 🚀 Setup

### 1. Clone the repo

```bash
git clone https://github.com/gummihurdal/kathy-attire-assistant.git
cd kathy-attire-assistant
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project (or use your existing `mjphpctvuxmbjhmcscoj` project — create a separate one recommended).
2. Go to **SQL Editor** and run the contents of `supabase-setup.sql`
3. Go to **Storage** and confirm the `wardrobe` bucket was created and is set to **Public**

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

- **Supabase keys**: Project → Settings → API
- **Anthropic key**: [console.anthropic.com](https://console.anthropic.com)

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📦 Deploy to GitHub Pages

```bash
npm run build
```

Then push the `dist/` folder, or use GitHub Actions:

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_ANTHROPIC_API_KEY: ${{ secrets.VITE_ANTHROPIC_API_KEY }}
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Add your secrets in: **GitHub → Repo → Settings → Secrets and variables → Actions**

---

## 🏗 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| Animations | Framer Motion |
| File upload | React Dropzone |
| Backend / DB | Supabase (PostgreSQL) |
| Image storage | Supabase Storage |
| AI | Claude claude-opus-4-5 (vision + text) |
| Fonts | Cormorant Garamond + Jost |
| Toasts | react-hot-toast |

---

## 🎨 Design

Royal Atelier aesthetic:
- **Obsidian** background with damask pattern texture
- **Gold** (#c9a84c) accents throughout
- **Cormorant Garamond** (serif, italic) for display
- **Jost** (light/regular) for body
- Micro-animations on every interaction
- Grid-based masonry wardrobe view

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Layout/       Header navigation
│   └── Wardrobe/     ItemCard, UploadModal
├── lib/
│   ├── supabase.js   DB + storage helpers
│   ├── claude.js     AI outfit generation
│   └── auth.jsx      Auth context
├── pages/
│   ├── Home.jsx      Landing page
│   ├── Wardrobe.jsx  Wardrobe grid
│   ├── Outfits.jsx   AI outfit generator
│   ├── Lookbook.jsx  Saved outfits
│   └── Auth.jsx      Sign in / sign up
└── styles/
    └── globals.css   Royal design system
```

---

*Made with love for Katherina. ♛*
