$ErrorActionPreference = "Stop"

$src     = "$PSScriptRoot\GSS-HMS"
$dst     = "$PSScriptRoot\GSS Hospital Pro"
$assets  = "$dst\resources\app\assets"
$appHtml = "$dst\resources\app\index.html"
$server  = "$dst\server\index.cjs"

Write-Host ""
Write-Host "==> Building GSS-HMS..." -ForegroundColor Cyan

Push-Location $src
try {
    npm run build:all
    if ($LASTEXITCODE -ne 0) { throw "Build failed (exit $LASTEXITCODE)" }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "==> Syncing to standalone..." -ForegroundColor Cyan

Remove-Item "$assets\*" -Force
Copy-Item "$src\dist\assets\*"   $assets    -Force
Copy-Item "$src\dist\index.html" $appHtml   -Force
Copy-Item "$src\dist-server\index.cjs" $server -Force

Write-Host ""
Write-Host "==> Standalone updated successfully!" -ForegroundColor Green
Write-Host ""
Get-ChildItem $assets | Select-Object Name, @{N="KB";E={[math]::Round($_.Length/1KB,1)}} | Format-Table -AutoSize
