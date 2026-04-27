@echo off
title GSS Hospital Pro — Unblock Files
color 0B

echo.
echo  ========================================================
echo    GSS Hospital Pro v2 — First-Time Setup
echo  ========================================================
echo.
echo  If you downloaded this app as a ZIP, Windows may block
echo  the files from running. This tool removes that block.
echo.
echo  Unblocking files...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "Get-ChildItem -Path '%~dp0' -Recurse -File | Unblock-File -ErrorAction SilentlyContinue; Write-Host '  [OK] All files unblocked successfully'"

echo.
echo  Done! You can now double-click 'Launch GSS Hospital Pro.bat'
echo  to start the application.
echo.
pause
