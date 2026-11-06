# Build and verify dist exists (PowerShell)
# Usage: ./scripts/build-local.ps1

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Error "npm not found in PATH. Install Node.js / npm first: https://nodejs.org/"
  exit 1
}

npm ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run vercel-build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not (Test-Path -Path "dist")) {
  Write-Error "Error: dist directory not found after build."
  exit 1
}

Write-Output "dist exists. Contents:"
Get-ChildItem -Path dist -Recurse | Select-Object -First 50
exit 0
