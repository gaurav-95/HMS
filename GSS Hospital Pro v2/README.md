# GSS Hospital Pro v2

## Gandhi Seva Sadan Hospital Management System

A standalone, full-featured Hospital Management System for Windows. Runs locally with zero cloud dependency — supports 18+ modules including patients, OPD, billing, pharmacy, lab, inventory, payroll, attendance, and more.

---

## Quick Start

### ⚠️ First Time Only — Unblock Files (Downloaded from the Internet)

If you received this app as a ZIP file, Windows marks all extracted files as "downloaded from the internet" and may block them from running.

**Run `Unblock Files (Run This First).bat` once** — right-click it → **Run as administrator** (or just double-click and click **Run** when prompted). This removes the block from all files in the folder.

> You only need to do this once. Skip this step if you received the folder directly (USB drive, shared network folder, etc.).

**System Requirements:** 64-bit Windows 10 or Windows 11.

---

### Step 1: Launch the App

**Double-click `Launch GSS Hospital Pro.bat`**

That's it. The launcher handles everything automatically:

1. Uses the bundled portable Node.js from the `runtime/` folder
2. Starts the API server on port 3001
3. Opens the app in a standalone desktop window (via Edge app mode)

### Step 2: Log In

Use any of the built-in demo accounts:

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | admin@gsshospital.com | password123 |
| **Doctor** | doctor@gsshospital.com | password123 |
| **Technician** | tech@gsshospital.com | password123 |
| **Accountant** | accountant@gsshospital.com | password123 |
| **Metron** | metron@gsshospital.com | password123 |
| **CEO** | ceo@gsshospital.com | password123 |
| **Receptionist** | receptionist@gsshospital.com | password123 |

Each role sees a different set of menus and permissions.

### Step 3: Stop the App

Close the app window, then **press any key** in the launcher CMD window to stop the server.

---

## LAN Access (Multi-Device)

The server binds to all network interfaces (`0.0.0.0`), so any device on the same local network can use the system.

### On the Host Machine

1. Run `Launch GSS Hospital Pro.bat` (or `Start Server.bat` for server-only mode)
2. Find your IP: open CMD and run `ipconfig` — look for your **IPv4 Address** (e.g., `192.168.x.x`)

### On Other Devices (any device on the same WiFi/LAN)

Open a browser and go to:

```
http://<host-ip>:3001
```

For example: `http://192.168.29.193:3001`

> **Note:** Windows Firewall may block incoming connections on port 3001. If LAN devices can't connect, add a firewall rule:
>
> ```
> netsh advfirewall firewall add rule name="GSS Hospital Pro" dir=in action=allow protocol=TCP localport=3001
> ```

---

## Files & Folders

| File / Folder | Purpose |
|---------------|---------|
| `Launch GSS Hospital Pro.bat` | **Main launcher** — starts server + opens app |
| `Start Server.bat` | Start API server only (for LAN / browser access) |
| `GSS Hospital Pro.exe` | Tauri desktop shell (requires rebuild — see below) |
| `server/index.cjs` | Bundled Express.js API server |
| `server/data/` | SQLite database (backup copy) |
| `data/` | **Active** SQLite database used by the server |
| `resources/app/dist/` | Built frontend (HTML/CSS/JS) |
| `runtime/` | Auto-created: portable Node.js (if downloaded) |
| `server/setup.js` | Auto-fixes native database driver for different architectures |

---

## Requirements

- **Windows 7 SP1 or later** (32-bit or 64-bit)
- **Internet connection** only needed on first run (to download Node.js + native driver if needed)
- **Microsoft Edge or Google Chrome** for standalone window mode (falls back to default browser)
- **Visual C++ Redistributable** — usually already installed; if the database driver fails to load, download from https://aka.ms/vs/17/release/vc_redist.x64.exe (or vc_redist.x86.exe for 32-bit)

---

## How It Works

```
Launch GSS Hospital Pro.bat
  │
  ├── 1. Finds/downloads Node.js
  ├── 2. Starts Express.js server (port 3001)
  │       ├── REST API at /api/*
  │       ├── SQLite database (data/gss-hms.db)
  │       └── Serves frontend static files
  ├── 2b. Auto-downloads correct native driver for your architecture
  └── 3. Opens Edge/Chrome in app mode (http://localhost:3001)
              └── Clean window, no address bar — looks like native app
```

The server serves **both** the API and the frontend, so everything runs from a single port (3001).

---

## Rebuilding the Tauri Desktop Exe (Optional)

The included `GSS Hospital Pro.exe` is a Tauri 2 desktop shell. To rebuild it with the latest frontend:

### Prerequisites

1. Install **Rust**: https://rustup.rs
2. Install **Node.js 20+**: https://nodejs.org

### Build

```bash
cd GSS-HMS-v2
npm install
npm run build:all          # Build frontend + server
npm run tauri build         # Build Tauri exe (takes 5-15 min first time)
```

The new exe and installers will be at:
- `src-tauri/target/release/GSS Hospital Pro.exe`
- `src-tauri/target/release/bundle/nsis/GSS Hospital Pro_2.0.0_x64-setup.exe`
- `src-tauri/target/release/bundle/msi/GSS Hospital Pro_2.0.0_x64_en-US.msi`

Copy the exe to this distribution folder to use it with the launcher.

---

## Development (Source Code)

The full source is in the `GSS-HMS-v2/` directory.

```bash
cd GSS-HMS-v2
npm install

# Run both frontend + backend in dev mode
npm run dev:all

# Or run separately:
npm run dev          # Vite dev server (port 1420)
npm run server:dev   # Express API with hot-reload (port 3001)

# Seed the database with demo data
npm run db:seed

# Inspect the database
npm run db:studio
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| App shows blank/white screen | Make sure the server is running (check for the minimized CMD window) |
| Login fails / "Invalid credentials" | The database may need seeding — run `Start Server.bat` to re-initialize |
| Port 3001 already in use | Close other apps using port 3001, or change `PORT=3002` in the environment |
| LAN devices can't connect | Check Windows Firewall — add an allow rule for port 3001 (see LAN section) |
| Node.js download fails | Install Node.js 20+ manually from https://nodejs.org then re-run the launcher |
| Edge not found | Install Microsoft Edge, or the app will fall back to your default browser |

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Backend | Express.js 5, Drizzle ORM, SQLite (better-sqlite3) |
| Desktop Shell | Tauri 2 (optional — requires Rust to build) |
| Charts | Recharts 3 |
| Exports | jsPDF + autoTable (PDF), xlsx (Excel) |
