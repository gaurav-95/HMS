@echo off
setlocal enabledelayedexpansion
title GSS Hospital Pro v2 — Launcher
color 0A

echo.
echo  ========================================================
echo    GSS Hospital Pro v2
echo    Gandhi Seva Sadan Hospital Management System
echo  ========================================================
echo.

REM ─── Configuration ──────────────────────────────────────
set "NODE_VER=v21.7.3"
set "MIN_NODE=18"

REM ─── Detect system architecture ─────────────────────────
set "ARCH=x64"
if "%PROCESSOR_ARCHITECTURE%"=="x86" (
    if not defined PROCESSOR_ARCHITEW6432 set "ARCH=x86"
)
echo  [OK] System: Windows %ARCH%

REM ─── Determine Node.js path ─────────────────────────────
set "NODE_EXE="
set "PORTABLE_NODE=%~dp0runtime\node.exe"

REM Check if portable Node already exists AND can actually run
if exist "%PORTABLE_NODE%" (
    "%PORTABLE_NODE%" -e "process.exit(0)" >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo  [OK] Using portable Node.js from runtime folder
        set "NODE_EXE=%PORTABLE_NODE%"
        goto :check_native
    ) else (
        echo  [!!] Portable Node.js incompatible with this system
        echo       Will download a compatible version...
        del "%PORTABLE_NODE%" >nul 2>&1
        goto :download_node
    )
)

REM Check system Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [!!] Node.js not found on this system
    echo       Will download a portable version automatically...
    goto :download_node
)

REM System node exists — verify it can run
node -e "process.exit(0)" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [!!] System Node.js could not start
    goto :download_node
)

REM Check version
for /f "tokens=*" %%v in ('node -e "process.stdout.write(String(process.versions.node.split(''.'')[0]))" 2^>nul') do set "SYS_MAJOR=%%v"

if !SYS_MAJOR! GEQ %MIN_NODE% (
    echo  [OK] System Node.js v!SYS_MAJOR! detected — compatible
    set "NODE_EXE=node"
    goto :check_native
) else (
    echo  [!!] System Node.js v!SYS_MAJOR! is too old ^(need v%MIN_NODE%+^)
    echo       Will download a compatible portable version...
    goto :download_node
)

:download_node
echo.
echo  ----------------------------------------------------------
echo   Downloading Node.js %NODE_VER% for %ARCH%...
echo   (One-time download, ~30 MB)
echo  ----------------------------------------------------------

set "NODE_URL=https://nodejs.org/dist/%NODE_VER%/win-%ARCH%/node.exe"
set "DL_PATH=%~dp0runtime\node.exe"

if not exist "%~dp0runtime" mkdir "%~dp0runtime"

REM Method 1: PowerShell WebClient (works on PowerShell 2.0+ / Win 7+)
echo  Downloading...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "try{[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12}catch{}; " ^
    "(New-Object Net.WebClient).DownloadFile('%NODE_URL%','%DL_PATH%')" >nul 2>&1

if exist "%DL_PATH%" (
    echo  [OK] Node.js downloaded successfully
    set "NODE_EXE=%DL_PATH%"
    goto :check_native
)

REM Method 2: certutil (built into Win 7+)
echo  Retrying with alternate method...
certutil -urlcache -split -f "%NODE_URL%" "%DL_PATH%" >nul 2>&1

if exist "%DL_PATH%" (
    echo  [OK] Node.js downloaded successfully
    set "NODE_EXE=%DL_PATH%"
    goto :check_native
)

REM Method 3: bitsadmin (legacy fallback)
bitsadmin /transfer "NodeJS" /download /priority high "%NODE_URL%" "%DL_PATH%" >nul 2>&1

if exist "%DL_PATH%" (
    echo  [OK] Node.js downloaded successfully
    set "NODE_EXE=%DL_PATH%"
    goto :check_native
)

echo.
echo  ==========================================================
echo   [ERROR] Could not download Node.js automatically!
echo.
echo   Please download it manually:
echo     URL:  %NODE_URL%
echo     Save as: %DL_PATH%
echo.
echo   Or install Node.js v%MIN_NODE%+ from https://nodejs.org
echo  ==========================================================
echo.
pause
exit /b 1

:check_native
REM ─── Check native database driver compatibility ─────────
echo  Checking database driver...

cd /d "%~dp0server"
"%NODE_EXE%" -e "try{require('better-sqlite3');process.exit(0)}catch(e){process.exit(1)}" >nul 2>&1
if !ERRORLEVEL! EQU 0 (
    echo  [OK] Database driver compatible
    cd /d "%~dp0"
    goto :show_version
)

echo  [!!] Database driver needs update for %ARCH%...
echo       Downloading compatible version (one-time)...

REM Run the setup script to download correct prebuild
"%NODE_EXE%" "%~dp0server\setup.js" 2>&1
if !ERRORLEVEL! EQU 0 (
    cd /d "%~dp0"
    goto :show_version
)

cd /d "%~dp0"
echo.
echo  ==========================================================
echo   [ERROR] Database driver could not be loaded!
echo.
echo   This usually means the Visual C++ Redistributable is
echo   not installed. Download and install it from:
echo     https://aka.ms/vs/17/release/vc_redist.%ARCH%.exe
echo.
echo   Then try launching again.
echo  ==========================================================
echo.
pause
exit /b 1

:show_version
for /f "delims=" %%v in ('"%NODE_EXE%" -v 2^>nul') do echo  [OK] Node.js version: %%v

:start_server
echo.
echo  Starting API server on port 3001...

REM Start API server in a minimized window
if "%NODE_EXE%"=="node" (
    start "GSS Hospital Pro - Server" /min cmd /c "cd /d "%~dp0server" && node index.cjs"
) else (
    start "GSS Hospital Pro - Server" /min cmd /c "cd /d "%~dp0server" && "%PORTABLE_NODE%" index.cjs"
)

REM Wait for server
echo  Waiting for server...
timeout /t 3 /nobreak >nul

REM Health check (compatible with PowerShell 2.0+)
powershell -NoProfile -Command ^
    "try { " ^
    "  if(Get-Command Invoke-WebRequest -ErrorAction SilentlyContinue) { " ^
    "    $null = Invoke-WebRequest 'http://localhost:3001/api/health' -TimeoutSec 5 -UseBasicParsing " ^
    "  } else { " ^
    "    $null = (New-Object Net.WebClient).DownloadString('http://localhost:3001/api/health') " ^
    "  }; " ^
    "  Write-Host '  [OK] API server ready' " ^
    "} catch { " ^
    "  Write-Host '  [..] Server starting (may take a moment)' " ^
    "}"

echo.
echo  Launching GSS Hospital Pro...

REM ─── Launch as standalone desktop window ────────────────
REM Try Edge first (app mode — clean window, no address bar)
set "EDGE_PATH="
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" set "EDGE_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" set "EDGE_PATH=C:\Program Files\Microsoft\Edge\Application\msedge.exe"

if defined EDGE_PATH (
    echo  [OK] Launching standalone window...
    start "" "%EDGE_PATH%" --app=http://localhost:3001 --window-size=1400,900
    goto :running
)

REM Try Chrome (app mode — works on Win 7+)
set "CHROME_PATH="
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"

if defined CHROME_PATH (
    echo  [OK] Launching standalone window (Chrome)...
    start "" "%CHROME_PATH%" --app=http://localhost:3001 --window-size=1400,900
    goto :running
)

REM Fallback: default browser
echo  [OK] Opening in default browser...
start "" "http://localhost:3001"

:running
echo.
echo  ========================================================
echo   GSS Hospital Pro is running!
echo.
echo   Local:  http://localhost:3001
echo   LAN:    http://^<your-ip^>:3001  (other devices)
echo.
echo   Close this window or press any key to stop the server.
echo  ========================================================
echo.
pause >nul

REM Kill the background server on exit
taskkill /FI "WINDOWTITLE eq GSS Hospital Pro - Server*" /F >nul 2>&1
echo  Server stopped. Goodbye!
timeout /t 2 >nul
