@echo off
setlocal enabledelayedexpansion
title GSS Hospital Pro v2 — Server Only
color 0B

echo.
echo  ========================================================
echo    GSS Hospital Pro v2 — API Server
echo  ========================================================
echo.

set "PORTABLE_NODE=%~dp0runtime\node.exe"

REM Determine which Node to use
if exist "%PORTABLE_NODE%" (
    set "NODE_CMD=%PORTABLE_NODE%"
    echo  Using portable Node.js
) else (
    where node >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo  [ERROR] Node.js not found!
        echo.
        echo  The portable Node.js runtime is missing from:
        echo    %~dp0runtime\node.exe
        echo.
        echo  To fix: download Node.js 22 LTS ^(Windows x64 .zip^) from
        echo    https://nodejs.org/dist/v22.15.0/node-v22.15.0-win-x64.zip
        echo  and extract contents into the "runtime" folder.
        echo.
        echo  Or install Node.js v20+ system-wide from https://nodejs.org
        pause
        exit /b 1
    )
    set "NODE_CMD=node"
    echo  Using system Node.js
)

echo  Starting on http://localhost:3001 ...
echo  Press Ctrl+C to stop.
echo.

cd /d "%~dp0server"
"%NODE_CMD%" index.cjs
pause
