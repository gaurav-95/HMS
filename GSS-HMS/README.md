# GSS Hospital Pro

Gandhi Seva Sadan — Hospital Management System

## Tech Stack
- **Frontend**: React 19 + TypeScript + Tailwind 4 + shadcn/ui + React Router 7
- **Desktop Shell**: Tauri 2.x (Rust)
- **Backend**: Express.js + Drizzle ORM + SQLite
- **Target**: Standalone Windows desktop + LAN browser access

## Development

```bash
# Install dependencies
npm install

# Run frontend only (Vite dev server)
npm run dev

# Run Tauri desktop app (frontend + native window)
npm run tauri dev

# Build for production
npm run tauri build
```

## Project Structure
```
src/              # React frontend
  components/     # Shared components + shadcn/ui
  pages/          # Route pages (one per module)
  context/        # React contexts (Auth)
  types/          # TypeScript type definitions
  constants/      # Mock data and constants
  lib/            # Utility functions
  hooks/          # Custom React hooks
  services/       # API client layer
src-tauri/        # Tauri native shell (Rust)
src-server/       # Express.js backend (future)
```
