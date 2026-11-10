# install.ps1 - Installs mod-manager into Herdr App
$ErrorActionPreference = "Stop"

$herdrHome = "$HOME\.config\herdr-app"
$targetModDir = Join-Path $herdrHome "mods\mod-manager"
$sourceModDir = Join-Path $PSScriptRoot "mods\mod-manager"

if (-not (Test-Path $sourceModDir)) {
    Write-Error "Source directory not found: $sourceModDir"
    exit 1
}

Write-Host "==> Installing mod-manager to $targetModDir ..." -ForegroundColor Cyan
if (-not (Test-Path $targetModDir)) {
    New-Item -ItemType Directory -Force -Path $targetModDir | Out-Null
}

Copy-Item -Path "$sourceModDir\*" -Destination $targetModDir -Recurse -Force

Write-Host "==> Verifying mod with herdr-app check..." -ForegroundColor Cyan
try {
    & herdr-app check $targetModDir
    Write-Host "==> mod-manager installed and verified successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To open Mod Manager:" -ForegroundColor Yellow
    Write-Host "  1. Run command: herdr-app do mod.open --name mod-manager" -ForegroundColor White
    Write-Host "  2. Or bind a shortcut in keys.json, for example:" -ForegroundColor White
    Write-Host '     "ctrl-shift-m": "mod.open:mod-manager"' -ForegroundColor Gray
    Write-Host "  3. Or add a Mods button into your sidebar header/footer mod!" -ForegroundColor White
    Write-Host ""
    Write-Host "Enjoy managing your Herdr mods!" -ForegroundColor Green
} catch {
    Write-Warning "Could not run 'herdr-app check'. Ensure 'herdr-app' is installed and in your PATH."
}
