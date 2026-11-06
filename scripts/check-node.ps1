# Check for node and npm, print helpful guidance if missing
param()

# Ensure PowerShell uses UTF-8 for console output to avoid garbled accents
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

Write-Info "Verification de l'environnement Node.js... (checking Node.js environment)"

$node = Get-Command node -ErrorAction SilentlyContinue
$npm = Get-Command npm -ErrorAction SilentlyContinue

if ($node -and $npm) {
    $nodeVersion = (& node -v) -replace "\r|\n",""
    $npmVersion = (& npm -v) -replace "\r|\n",""
    Write-Info "Node trouvé: $nodeVersion"
    Write-Info "npm trouvé: $npmVersion"
    Write-Info "Exécution d'une installation des dépendances (npm ci)..."

    try {
        npm ci
        Write-Info "Dépendances installées avec succès. Vous pouvez maintenant lancer 'npm run vercel-build'."
        exit 0
    } catch {
        Write-Err "Échec de 'npm ci'. Rerun with verbose output: npm ci --loglevel verbose"
        exit 2
    }
} else {
    Write-Err "Node.js et/ou npm introuvable(s) dans le chemin d'exécution."
    Write-Warn "Si vous êtes sur Windows, installez Node.js LTS depuis https://nodejs.org (ou utilisez nvm-windows: https://github.com/coreybutler/nvm-windows)."
    Write-Host ""
    Write-Host "Options:
  1) Installer Node depuis le site officiel: https://nodejs.org
  2) Installer nvm-windows: https://github.com/coreybutler/nvm-windows
  3) Exécuter le script d'aide d'installation: ./scripts/install-node.ps1 (interactive, vous demandera confirmation)"
    exit 126
}
