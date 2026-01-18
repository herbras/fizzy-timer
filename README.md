# Fizzy Timer

A focus timer PWA companion app for [Fizzy](https://fizzy.do). Track your focus sessions, manage tasks from your boards, and stay productive.

## Features

- **Focus Timer** - Full-screen distraction-free timer with countdown/stopwatch modes
- **Board Integration** - View and select tasks from your Fizzy boards
- **Session History** - Track all your focus sessions with notes
- **Weekly Reports** - Visualize your productivity over time
- **PWA Support** - Install on any device (iOS, Android, Windows, macOS)
- **Offline First** - Works without internet using IndexedDB
- **Dark Theme** - Eye-friendly dark mode with gold/amber accents

## Tech Stack

- **React** + **TanStack Router** - Frontend framework
- **Vite** + **vite-plugin-pwa** - Build tooling & PWA
- **TailwindCSS** + **shadcn/ui** - Styling & components
- **Convex** - Backend & real-time sync
- **Dexie** - IndexedDB wrapper for offline storage
- **Turborepo** - Monorepo management

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.3+
- [Convex](https://convex.dev) account

### Installation

```bash
# Install dependencies
bun install

# Setup Convex backend
bun run dev:setup

# Start development server
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Project Structure

```
fizzy-timer/
├── apps/
│   └── web/              # PWA frontend
│       ├── src/
│       │   ├── components/   # React components
│       │   ├── lib/          # Hooks, utils, services
│       │   └── routes/       # TanStack Router pages
│       └── public/           # Static assets & PWA icons
├── packages/
│   ├── backend/          # Convex functions & schema
│   ├── config/           # Shared TypeScript config
│   ├── env/              # Environment variables
│   └── infra/            # Cloudflare deployment (Alchemy)
└── docs/                 # API documentation
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start all apps in development |
| `bun run dev:web` | Start web app only |
| `bun run build` | Build all apps |
| `bun run check` | Run Biome linting & formatting |
| `bun run check-types` | TypeScript type checking |
| `bun run deploy` | Deploy to Cloudflare |

## Deployment

Deploy to Cloudflare Pages via Alchemy:

```bash
bun run deploy
```

## API

See [docs/api.md](./docs/api.md) for Fizzy API integration details.

## License

MIT
