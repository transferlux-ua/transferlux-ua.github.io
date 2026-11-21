# Builds the site and publishes dist/ to the gh-pages branch (GitHub Pages).
# Usage: powershell -File scripts\deploy-pages.ps1 -Api https://transferlux-api.<sub>.workers.dev
param([Parameter(Mandatory = $true)][string]$Api)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
$env:VITE_API_BASE = $Api
npm run build
if ($LASTEXITCODE -ne 0) { throw "build failed" }
$tmp = Join-Path $env:TEMP ("tlx-pages-" + [guid]::NewGuid().ToString("N"))
Copy-Item -Recurse dist $tmp
Set-Location $tmp
$ErrorActionPreference = "Continue"
git init -q -b gh-pages
git config core.autocrlf false
git config user.name "TransferLux"
git config user.email "337822518+badenbaden777@users.noreply.github.com"
git add -A
git commit -q -m "Publish $(Get-Date -Format s)"
git push -q -f https://github.com/transferlux-ua/transferlux-ua.github.io.git gh-pages
Set-Location $root
Remove-Item -Recurse -Force $tmp
"published"
