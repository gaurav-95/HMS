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
        echo  [ERROR] Node.js not found. Run "Launch GSS Hospital Pro.bat"
        echo          first — it will download Node.js automatically.
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
