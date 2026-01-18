# Fizzy Timer

A focus timer PWA that integrates with [Fizzy](https://fizzy.do) to track work sessions and share worklogs with your team.

## Why Fizzy Timer?

I needed a way to track my focus time while working on tasks from my Fizzy boards. With Fizzy Timer, I can:

- **Start a timer on any task** from my Fizzy boards
- **Log work sessions** with notes and duration
- **Share worklogs** with my team automatically
- **Track team productivity** - see who worked on what and for how long

Perfect for remote teams who want transparency in work tracking without micromanagement.

## Features

- **Focus Timer** - Countdown or stopwatch mode for deep work sessions
- **Fizzy Integration** - Pull tasks directly from your Fizzy boards
- **Worklog Sync** - Sessions automatically sync to Fizzy for team visibility
- **Session History** - Review past sessions with notes and duration
- **Weekly Reports** - Visualize your productivity trends
- **Multi-user Support** - Switch between team members on shared devices
- **PWA** - Install on iOS, Android, Windows, or macOS
- **Offline First** - Works without internet, syncs when back online
- **Dark Theme** - Easy on the eyes with gold/amber accents

## How It Works

1. **Connect to Fizzy** - Login with your Fizzy account
2. **Select a task** - Choose from your boards or create a quick task
3. **Start the timer** - Focus on your work
4. **Stop & log** - Add notes and save your session
5. **Team sees it** - Worklog appears in Fizzy for your team

## Tech Stack

- **React** + **TanStack Router**
- **Vite** + **vite-plugin-pwa**
- **TailwindCSS** + **shadcn/ui**
- **Dexie (IndexedDB)** - Offline storage
- **Fizzy API** - Worklog sync

## Getting Started

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

Open [http://localhost:3001](http://localhost:3001)

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run check` | Lint & format with Biome |
| `bun run deploy` | Deploy to Cloudflare |

## API Integration

See [docs/api.md](./docs/api.md) for Fizzy API details.

## License

MIT
