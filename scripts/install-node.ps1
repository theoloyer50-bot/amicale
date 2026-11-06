# Interactive helper to download Node.js LTS installer for Windows and launch it (requires user confirmation)
param()

function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

Write-Info "Ce script va télécharger l'installateur Node.js LTS pour Windows et le lancer (il ne l'installera pas silencieusement sans confirmation)."

$confirm = Read-Host "Voulez-vous continuer et télécharger l'installateur Node LTS depuis nodejs.org ? (o/N)"
if ($confirm -ne 'o' -and $confirm -ne 'O') {
    Write-Warn "Annulé par l'utilisateur."
    exit 1
}

$arch = if ([Environment]::Is64BitOperatingSystem) { 'x64' } else { 'x86' }
$installerUrl = "https://nodejs.org/dist/latest-v18.x/node-v18.999.999-$arch.msi" # fallback URL template

# Try to resolve the actual LTS MSI URL from the index.json
try {
    Write-Info "Récupération des métadonnées Node.js pour obtenir la dernière LTS..."
    $index = Invoke-RestMethod -Uri 'https://nodejs.org/dist/index.json' -UseBasicParsing -ErrorAction Stop
    $ltsEntry = $index | Where-Object { $_.lts -ne $null } | Select-Object -First 1
    if ($ltsEntry) {
        $version = $ltsEntry.version -replace '^v',''
        $archSuffix = if ($arch -eq 'x64') { 'x64' } else { 'x86' }
        $installerUrl = "https://nodejs.org/dist/$($ltsEntry.version)/node-$($ltsEntry.version)-win-$archSuffix.msi"
    }
} catch {
    Write-Warn "Impossible de récupérer la version LTS automatiquement. Veuillez visiter https://nodejs.org pour télécharger l'installateur LTS manuellement."
    exit 2
}

$tmp = [IO.Path]::GetTempPath()
$installerPath = Join-Path $tmp ([IO.Path]::GetFileName($installerUrl))

Write-Info "Téléchargement de $installerUrl -> $installerPath"
try {
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing -ErrorAction Stop
    Write-Info "Téléchargement terminé.
Lancement de l'installateur (vous devrez accepter l'installateur)."
    Start-Process -FilePath $installerPath -Verb RunAs
    Write-Info "L'installateur a été lancé. Attendez la fin de l'installation, puis rouvrez PowerShell et exécutez './scripts/check-node.ps1'"
    exit 0
} catch {
    Write-Err "Échec du téléchargement ou du lancement: $_"
    exit 2
}
