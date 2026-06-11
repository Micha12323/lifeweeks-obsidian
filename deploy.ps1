# Deploy des Plugins in den ECHTEN Vault (MCB).
# Nur manuell ausführen – Vault-Regel: Änderungen in MCB/ nur nach Rückfrage!
# Voraussetzung: vorher `npm run build` (Production-Build im test-vault).

$ErrorActionPreference = "Stop"

$src = Join-Path $PSScriptRoot "test-vault\.obsidian\plugins\lifeweeks"
$dst = "C:\Users\MichaelChristianBaum\Documents\Zusätzliches\Personal\MCB\.obsidian\plugins\lifeweeks"

if (-not (Test-Path (Join-Path $src "main.js"))) {
    Write-Error "Kein Build gefunden ($src\main.js fehlt). Erst 'npm run build' ausführen."
}

New-Item -ItemType Directory -Force $dst | Out-Null
foreach ($f in @("main.js", "manifest.json", "styles.css")) {
    Copy-Item (Join-Path $src $f) (Join-Path $dst $f) -Force
    Write-Host "Kopiert: $f"
}
Write-Host "Deploy nach $dst abgeschlossen. Plugin in Obsidian ggf. neu laden."
