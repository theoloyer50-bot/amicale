# Trigger a Vercel deploy using Vercel CLI (PowerShell)
# Usage: ./scripts/deploy-vercel.ps1 -Prod
param(
  [switch]$Prod
)

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  Write-Output "Vercel CLI not found. Try 'npm i -g vercel' or use the Vercel dashboard to redeploy."
  exit 1
}

if ($Prod) {
  vercel --prod --confirm
} else {
  vercel --confirm
}
