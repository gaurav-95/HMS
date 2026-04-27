#Requires -Version 5.1
<#
.SYNOPSIS
    Automatically launches GSS Hospital Pro, navigates through every page,
    and saves 1440x900 PNG screenshots to the screenshots\ folder.

.DESCRIPTION
    - Uses playwright-core + system Microsoft Edge (no browser download, no Chromium).
    - Starts the bundled server from "GSS Hospital Pro\server\index.cjs".
    - Stops the server when done (or if the script errors).
    - Opens the screenshots\ folder when finished.

.USAGE
    Right-click -> Run with PowerShell
    -- or --
    powershell -ExecutionPolicy Bypass -File "take-screenshots.ps1"
#>

$ErrorActionPreference = 'Stop'
$Root       = $PSScriptRoot
$ScriptsDir = "$Root\scripts"
$ServerDir  = "$Root\GSS Hospital Pro\server"
$OutputDir  = "$Root\screenshots"

Write-Host ''
Write-Host '  +----------------------------------------------+' -ForegroundColor Cyan
Write-Host '  |   GSS Hospital Pro - Screenshot Tool         |' -ForegroundColor Cyan
Write-Host '  +----------------------------------------------+' -ForegroundColor Cyan
Write-Host ''

# --- 1. Find Node.js ---
# Prefer the portable single-file runtime (already present after first app launch).
# Fall back to system Node.js (needed for npm install of playwright-core).

$PortableNode = "$Root\GSS Hospital Pro\runtime\node.exe"
$ServerNode   = $null
$NpmNode      = $null   # node used to run npm/scripts (must have npm available)

if (Test-Path $PortableNode) {
    $ServerNode = $PortableNode
    Write-Host '  [node]  Portable runtime found.' -ForegroundColor Green
} else {
    Write-Host '  [node]  Portable runtime not found - using system Node.js for server.' -ForegroundColor Yellow
}

# System node is required for npm install and for running the Playwright script
if (Get-Command node -ErrorAction SilentlyContinue) {
    $NpmNode = 'node'
    Write-Host '  [node]  System Node.js found.' -ForegroundColor Green
    if (-not $ServerNode) { $ServerNode = 'node' }
} else {
    Write-Host ''
    Write-Host '  [ERROR] System Node.js not found.' -ForegroundColor Red
    Write-Host '          Install Node.js 18+ from https://nodejs.org then re-run this script.' -ForegroundColor Red
    Write-Host ''
    Read-Host '  Press Enter to exit'
    exit 1
}

# --- 2. Check Microsoft Edge is installed (required by playwright-core) ---
$EdgePaths = @(
    'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    'C:\Program Files\Microsoft\Edge\Application\msedge.exe'
)
$EdgeFound = $EdgePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $EdgeFound) {
    Write-Host ''
    Write-Host '  [ERROR] Microsoft Edge not found.' -ForegroundColor Red
    Write-Host '          Edge is required by playwright-core for headless screenshots.' -ForegroundColor Red
    Write-Host '          Install Edge from https://www.microsoft.com/edge' -ForegroundColor Red
    Write-Host ''
    Read-Host '  Press Enter to exit'
    exit 1
}
Write-Host "  [edge]  Found: $EdgeFound" -ForegroundColor Green

# --- 3. Install playwright-core (once) ---
if (-not (Test-Path "$ScriptsDir\node_modules\playwright-core")) {
    Write-Host ''
    Write-Host '  Installing playwright-core (first run only, ~6 MB, no browser download)...' -ForegroundColor Cyan

    Push-Location $ScriptsDir
    try {
        & npm install --silent 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "npm install failed (exit $LASTEXITCODE)" }
    } finally {
        Pop-Location
    }

    Write-Host '  playwright-core installed.' -ForegroundColor Green
}

# --- 4. Check port 3001 ---
$Port3001InUse = netstat -ano 2>$null |
    Select-String ':3001\s+.*LISTENING' |
    Select-Object -First 1

$WeStartedServer = $false
$ServerProcess   = $null

if ($Port3001InUse) {
    Write-Host ''
    Write-Host '  [server]  Port 3001 already in use - using existing server.' -ForegroundColor Yellow
} else {
    # Run setup.js to fix native driver for this machine (same as the bat)
    Write-Host ''
    Write-Host '  [server]  Checking database driver...' -ForegroundColor Cyan

    $driverOk = & $ServerNode -e "try{require('better-sqlite3');process.exit(0)}catch(e){process.exit(1)}" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host '  [server]  Rebuilding native driver (one-time setup)...' -ForegroundColor Yellow
        Push-Location $ServerDir
        & $ServerNode setup.js 2>&1
        Pop-Location
        if ($LASTEXITCODE -ne 0) {
            Write-Host '  [ERROR] Database driver setup failed.' -ForegroundColor Red
            exit 1
        }
    }

    # Start the server
    Write-Host '  [server]  Starting server...' -ForegroundColor Cyan

    $ServerProcess = Start-Process `
        -FilePath    $ServerNode `
        -ArgumentList '"index.cjs"' `
        -WorkingDirectory $ServerDir `
        -PassThru `
        -WindowStyle Hidden

    $WeStartedServer = $true
    Write-Host "  [server]  PID $($ServerProcess.Id) - http://localhost:3001" -ForegroundColor Green
}

# --- 5. Run the screenshot script ---
Write-Host ''
Write-Host '  Taking screenshots...' -ForegroundColor Cyan
Write-Host ''

$Success = $false
try {
    Push-Location $ScriptsDir
    & $NpmNode 'take-screenshots.mjs'
    Pop-Location

    if ($LASTEXITCODE -eq 0) {
        $Success = $true
    } else {
        throw "Screenshot script exited with code $LASTEXITCODE"
    }
} catch {
    Write-Host ''
    Write-Host "  [ERROR] $_" -ForegroundColor Red
} finally {
    # Stop server if we started it
    if ($WeStartedServer -and $ServerProcess -and -not $ServerProcess.HasExited) {
        Stop-Process -Id $ServerProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host ''
        Write-Host '  [server]  Stopped.' -ForegroundColor Gray
    }
}

# --- 6. Done ---
Write-Host ''
if ($Success) {
    Write-Host '  +----------------------------------------------+' -ForegroundColor Green
    Write-Host '  |   Done!  screenshots\ is ready for GitHub    |' -ForegroundColor Green
    Write-Host '  +----------------------------------------------+' -ForegroundColor Green
    Write-Host ''
    Write-Host '  Tip: Embed in your README.md like this:' -ForegroundColor DarkGray
    Write-Host ''
    Write-Host '    | Login | Dashboard | Staff |' -ForegroundColor DarkGray
    Write-Host '    |-------|-----------|-------|' -ForegroundColor DarkGray
    Write-Host '    | ![Login](screenshots/01-login.png) | ![Dashboard](screenshots/02-dashboard.png) | ![Staff](screenshots/03-staff-directory.png) |' -ForegroundColor DarkGray
    Write-Host ''

    if (Test-Path $OutputDir) {
        Start-Process explorer $OutputDir
    }
} else {
    Write-Host '  Screenshots were not completed. Check the error above.' -ForegroundColor Red
    Write-Host ''
    Read-Host '  Press Enter to exit'
}
