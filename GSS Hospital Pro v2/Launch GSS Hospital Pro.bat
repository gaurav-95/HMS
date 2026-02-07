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
echo  ----------------------------------------------------------
echo   Downloading Node.js 22 LTS (portable) ...
echo   This is a one-time download (~30 MB). Please wait.
echo  ----------------------------------------------------------
echo.

set "NODE_URL=https://nodejs.org/dist/v22.15.0/node-v22.15.0-win-x64.zip"
set "NODE_ZIP=%~dp0runtime\node-portable.zip"
set "NODE_DIR=%~dp0runtime"

if not exist "%NODE_DIR%" mkdir "%NODE_DIR%"

REM Download using PowerShell
echo  Downloading from nodejs.org ...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; " ^
    "$ProgressPreference = 'SilentlyContinue'; " ^
    "try { " ^
    "  Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%NODE_ZIP%' -UseBasicParsing; " ^
    "  Write-Host '  Download complete.' " ^
    "} catch { " ^
    "  Write-Host ('  ERROR: ' + $_.Exception.Message); " ^
    "  exit 1 " ^
    "}"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  Download failed. Check your internet connection, or
    echo  install Node.js v20+ manually from https://nodejs.org
    pause
    exit /b 1
)

REM Extract
echo  Extracting...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ProgressPreference = 'SilentlyContinue'; " ^
    "Expand-Archive -Path '%NODE_ZIP%' -DestinationPath '%NODE_DIR%\temp' -Force; " ^
    "$inner = Get-ChildItem '%NODE_DIR%\temp' -Directory | Select-Object -First 1; " ^
    "Copy-Item (Join-Path $inner.FullName '*') '%NODE_DIR%\' -Recurse -Force; " ^
    "Remove-Item '%NODE_DIR%\temp' -Recurse -Force; " ^
    "Remove-Item '%NODE_ZIP%' -Force; " ^
    "Write-Host '  Done.'"

if not exist "%PORTABLE_NODE%" (
    echo  [ERROR] Extraction failed. Please install Node.js manually.
    pause
    exit /b 1
)

echo  [OK] Node.js 22 LTS installed to runtime folder
set "NODE_EXE=%PORTABLE_NODE%"

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
echo  Launching desktop app...
start "" "%~dp0GSS Hospital Pro.exe"

echo.
echo  ========================================================
echo   App is running! You can minimize this window.
echo   Close this window or press any key to stop the server.
echo  ========================================================
echo.
pause >nul

REM Kill the background server on exit
taskkill /FI "WINDOWTITLE eq GSS Hospital Pro - Server*" /F >nul 2>&1
echo  Server stopped. Goodbye!
timeout /t 2 >nul
