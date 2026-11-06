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

git add package.json README.md firebase.json .firebaserc database.rules.json scripts/check-dist.js scripts/build-local.ps1 scripts/check-node.ps1 scripts/local-build.js scripts/README.md scripts/commit-and-push.ps1 src/ADMIN_SETUP.md src/test-kv-keys.md src/supabase/functions/server/kv_store.tsx || exit $LASTEXITCODE

git commit -m $Message || Write-Output "Nothing to commit or commit failed"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

git push origin $Branch || Write-Error "git push failed; check remote/credentials"
