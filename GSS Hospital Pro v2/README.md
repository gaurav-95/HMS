# GSS Hospital Pro v2
## Gandhi Seva Sadan Hospital Management System

### Quick Start (one click)
**Double-click `Launch GSS Hospital Pro.bat`** — it handles everything:
- Detects if Node.js is installed
- If not, downloads a portable Node.js 22 LTS automatically (~30 MB, one-time)
- Starts the API server
- Launches the desktop app

### Requirements
- **Windows 10 or 11** (WebView2 is pre-installed on all modern Windows)
- **Internet connection** only needed on first run if Node.js isn't installed

### Default Login
- **Email:** admin@gsshospital.com
- **Password:** password123

### What's Inside
| File | Purpose |
|------|---------|
| `Launch GSS Hospital Pro.bat` | **Start everything** — server + app (auto-installs Node if needed) |
| `Start Server.bat` | Start API server only |
| `GSS Hospital Pro.exe` | Desktop app (portable, uses system WebView2) |
| `GSS Hospital Pro_2.0.0_x64-setup.exe` | Optional: NSIS installer |
| `GSS Hospital Pro_2.0.0_x64_en-US.msi` | Optional: MSI installer |
| `server/` | Bundled API server + SQLite database |
| `runtime/` | Auto-created: portable Node.js (if downloaded) |

### Troubleshooting
- **App shows blank/error?** Make sure the server is running (check if the minimized CMD window is still open)
- **Port 3001 in use?** Close other apps using that port, then retry
- **Node download fails?** Install Node.js 20+ manually from https://nodejs.org then re-run the launcher
