@echo off
setlocal enabledelayedexpansion
title GSS Hospital Pro v2 — Server Only
color 0B

echo.
echo  ========================================================
echo    GSS Hospital Pro v2 — API Server
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
echo  System: Windows %ARCH%
REM ─── Require 64-bit Windows ────────────────────────────
if "%ARCH%"=="x86" (
    echo.
    echo  [ERROR] 64-bit Windows required. This application does not
    echo  support 32-bit Windows.
    echo.
    pause
    exit /b 1
)
REM ─── Determine Node.js path ─────────────────────────────
set "PORTABLE_NODE=%~dp0runtime\node.exe"

REM Check if portable Node exists and can run
if exist "%PORTABLE_NODE%" (
    "%PORTABLE_NODE%" -e "process.exit(0)" >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        set "NODE_CMD=%PORTABLE_NODE%"
        echo  Using portable Node.js
        goto :check_native
    ) else (
        echo  [!!] Portable Node.js incompatible — downloading correct version...
        del "%PORTABLE_NODE%" >nul 2>&1
        goto :download_node
    )
)

REM Check system Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto :download_node

node -e "process.exit(0)" >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto :download_node

for /f "tokens=*" %%v in ('node -e "process.stdout.write(String(process.versions.node.split(''.'')[0]))" 2^>nul') do set "SYS_MAJOR=%%v"

if !SYS_MAJOR! GEQ %MIN_NODE% (
    set "NODE_CMD=node"
    echo  Using system Node.js v!SYS_MAJOR!
    goto :check_native
)

:download_node
echo.
echo  Downloading Node.js %NODE_VER% for %ARCH%...

set "NODE_URL=https://nodejs.org/dist/%NODE_VER%/win-%ARCH%/node.exe"
set "DL_PATH=%~dp0runtime\node.exe"

if not exist "%~dp0runtime" mkdir "%~dp0runtime"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "try{[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12}catch{}; " ^
    "(New-Object Net.WebClient).DownloadFile('%NODE_URL%','%DL_PATH%')" >nul 2>&1

if not exist "%DL_PATH%" (
    certutil -urlcache -split -f "%NODE_URL%" "%DL_PATH%" >nul 2>&1
)

if not exist "%DL_PATH%" (
    bitsadmin /transfer "NodeJS" /download /priority high "%NODE_URL%" "%DL_PATH%" >nul 2>&1
)

if exist "%DL_PATH%" (
    echo  [OK] Node.js downloaded
    set "NODE_CMD=%DL_PATH%"
    goto :check_native
)

echo  [ERROR] Could not download Node.js!
echo.
echo  Download manually from: %NODE_URL%
echo  Save as: %DL_PATH%
echo.
echo  Or install Node.js v%MIN_NODE%+ from https://nodejs.org
pause
exit /b 1

:check_native
REM ─── Check native database driver ──────────────────────
cd /d "%~dp0server"
"%NODE_CMD%" -e "try{require('better-sqlite3');process.exit(0)}catch(e){process.exit(1)}" >nul 2>&1
if !ERRORLEVEL! EQU 0 goto :start

echo  Updating database driver for %ARCH%...
"%NODE_CMD%" "%~dp0server\setup.js" 2>&1
if !ERRORLEVEL! NEQ 0 (
    echo.
    echo  [ERROR] Database driver could not be loaded!
    echo  Please contact support or re-download the application.
    echo.
    pause
    exit /b 1
)

:start
REM ─── Check if port 3001 is already in use ──────────────
netstat -an 2>nul | find ":3001 " | find "LISTENING" >nul 2>&1
if !ERRORLEVEL! EQU 0 (
    echo.
    echo  [ERROR] Port 3001 is already in use!
    echo  Another application is using port 3001.
    echo  Please close it and try again, or restart your PC.
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0server"
echo.
echo  Starting on http://localhost:3001 ...
echo  Press Ctrl+C to stop.
echo.

"%NODE_CMD%" index.cjs
pause
