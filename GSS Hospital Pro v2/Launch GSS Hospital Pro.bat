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

REM ─── Determine Node.js path ─────────────────────────────
set "NODE_EXE="
set "PORTABLE_NODE=%~dp0runtime\node.exe"

REM Check if portable Node already downloaded
if exist "%PORTABLE_NODE%" (
    echo  [OK] Using portable Node.js from runtime folder
    set "NODE_EXE=%PORTABLE_NODE%"
    goto :check_version
)

REM Check system Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [!!] Node.js is not installed on this system
    echo       Will download a portable version automatically...
    goto :download_node
)

REM System node exists — check version
for /f "delims=v." %%a in ('node -v 2^>nul') do set "SYS_MAJOR=%%a"
REM node -v gives "v22.x.x" — after delims=v. first token is empty, so try differently
for /f "tokens=*" %%v in ('node -e "process.stdout.write(String(process.versions.node.split(''.'')[0]))" 2^>nul') do set "SYS_MAJOR=%%v"

if !SYS_MAJOR! GEQ 20 (
    echo  [OK] System Node.js v!SYS_MAJOR! detected — compatible
    set "NODE_EXE=node"
    goto :start_server
) else (
    echo  [!!] System Node.js v!SYS_MAJOR! is too old ^(need v20+^)
    echo       Will download a compatible portable version...
    goto :download_node
)

:download_node
echo.
echo  ==========================================================
echo   [ERROR] Node.js runtime not found!
echo.
echo   The portable Node.js runtime is missing from:
echo     %~dp0runtime\node.exe
echo.
echo   This application is designed to run fully offline.
echo   The "runtime" folder with Node.js should have been
echo   included with the application.
echo.
echo   To fix this:
echo     1. Download Node.js 22 LTS (Windows x64 .zip) from:
echo        https://nodejs.org/dist/v22.15.0/node-v22.15.0-win-x64.zip
echo     2. Extract the ZIP contents into the "runtime" folder
echo        so that runtime\node.exe exists.
echo.
echo   Or install Node.js v20+ system-wide from https://nodejs.org
echo  ==========================================================
echo.
pause
exit /b 1

:check_version
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

REM Health check
powershell -NoProfile -Command ^
    "try { " ^
    "  $null = Invoke-WebRequest 'http://localhost:3001/api/health' -TimeoutSec 5 -UseBasicParsing; " ^
    "  Write-Host '  [OK] API server ready' " ^
    "} catch { " ^
    "  Write-Host '  [..] Server starting (may take a moment)' " ^
    "}"

echo.
echo  Launching GSS Hospital Pro...

REM ─── Launch as standalone desktop window ────────────────
REM Use Edge app mode (clean window, no address bar — looks like native app)
set "EDGE_PATH="
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" set "EDGE_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" set "EDGE_PATH=C:\Program Files\Microsoft\Edge\Application\msedge.exe"

if defined EDGE_PATH (
    echo  [OK] Launching standalone window...
    start "" "%EDGE_PATH%" --app=http://localhost:3001 --window-size=1400,900
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
