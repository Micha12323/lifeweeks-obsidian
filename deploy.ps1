# Deploy des Plugins in den ECHTEN Vault (MCB).
# Nur manuell ausführen – Vault-Regel: Änderungen in MCB/ nur nach Rückfrage!
# Voraussetzung: vorher `npm run build` (Production-Build im test-vault).

$ErrorActionPreference = "Stop"

$src = Join-Path $PSScriptRoot "test-vault\.obsidian\plugins\lifeweeks"
# Pfad relativ zum Skript ableiten (Personal/lifeweeks/obsidian-plugin -> Personal/MCB).
# Kein Umlaut-Literal: Windows PowerShell 5.1 liest UTF-8 ohne BOM als ANSI und
# wuerde sonst in einen falschen "ZusÃ¤tzliches"-Ordner deployen.
$personal = Split-Path (Split-Path $PSScriptRoot)
$dst = Join-Path $personal "MCB\.obsidian\plugins\lifeweeks"

if (-not (Test-Path (Join-Path $src "main.js"))) {
    Write-Error "Kein Build gefunden ($src\main.js fehlt). Erst 'npm run build' ausführen."
}

New-Item -ItemType Directory -Force $dst | Out-Null
foreach ($f in @("main.js", "manifest.json", "styles.css")) {
    Copy-Item (Join-Path $src $f) (Join-Path $dst $f) -Force
    Write-Host "Kopiert: $f"
}
Write-Host "Deploy nach $dst abgeschlossen. Plugin in Obsidian ggf. neu laden."
