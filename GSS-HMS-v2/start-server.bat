@echo off
title GSS Hospital Pro — Server
echo =============================================
echo   GSS Hospital Pro - API Server
echo   Gandhi Seva Sadan Hospital Management
echo =============================================
echo.
echo Starting API server on port 3001...
echo.
cd /d "%~dp0"
node dist-server/index.cjs
pause
