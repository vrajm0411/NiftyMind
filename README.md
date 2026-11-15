# NiftyMind

AI-powered stock analysis and prediction platform for the Indian equity market (NSE/BSE), built with Next.js 14.

NiftyMind combines live market data from **Upstox**, company fundamentals from **Screener.in**, and LLM reasoning (**Llama 3.3 70B via Groq**) to produce streaming research reports, price forecasts, and portfolio insights.

## Features

- **AI Analysis** — streaming research reports with bull/bear cases, health score, risk meter, and a clear verdict
- **AI Prediction** — multi-horizon direction and price-target forecasts with confidence and supporting signals
- **Market Dashboard** — indices, top movers, quotes, candlestick and volume charts with technical indicators
- **Portfolio** — live holdings and positions synced from your Upstox account
- **Watchlist** — track stocks with sparkline trends
- **Crisis Performance** — how a stock behaved during major historical market crashes
- **Secure Auth** — JWT sessions, bcrypt passwords, Upstox OAuth, optional Cloudflare Turnstile

## Tech Stack

| Layer | Tools |
|-------|-------|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| UI | Tailwind CSS, Framer Motion, Recharts, Lucide |
| State | Zustand |
| Data | PostgreSQL + Prisma |
| Auth | jose (JWT), bcryptjs |
| Integrations | Upstox API, Groq, Screener.in / Apify |

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Upstox developer app and Groq API key

### Setup

```bash
git clone https://github.com/vrajm0411/NiftyMind.git
cd NiftyMind
npm install
cp .env.example .env.local   # fill in your keys
cp .env.example .env         # Prisma CLI reads DATABASE_URL from .env
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/            Routes, dashboard pages and API handlers
  api/          auth, market, portfolio, analysis & prediction streams
components/     Charts and UI components
hooks/          Client hooks (auth, stock, analysis, prediction)
lib/
  ai/           Prompts, analyzers, technical indicators, streaming
  upstox/       Upstox client, market data, portfolio, instruments
  screener/     Fundamentals scraping and parsing
  auth/         JWT, sessions, passwords, Turnstile
prisma/         Database schema
deploy/         Server deployment guide and setup script
```

## Deployment

See [`deploy/DEPLOY.md`](deploy/DEPLOY.md) for a step-by-step guide to deploying on an Oracle Cloud (OCI) instance.

## Disclaimer

NiftyMind is for educational and research purposes only. AI-generated analysis is not financial advice. Do your own research before investing.
