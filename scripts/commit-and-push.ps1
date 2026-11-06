# Commit and push changed files (PowerShell)
# Usage: ./scripts/commit-and-push.ps1 -Message "your commit message" -Branch "main"
param(
  [string]$Message = "chore: ensure build outputs to dist and add postbuild check",
  [string]$Branch = "main"
)

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "git not found in PATH. Install Git and ensure it's available in the terminal. https://git-scm.com/"
  exit 1
}

git add vite.config.ts package.json vercel.json scripts/check-dist.js scripts/build-local.ps1 scripts/commit-and-push.ps1 scripts/deploy-vercel.ps1 || exit $LASTEXITCODE

git commit -m $Message || Write-Output "Nothing to commit or commit failed"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

git push origin $Branch || Write-Error "git push failed; check remote/credentials"
