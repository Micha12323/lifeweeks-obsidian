# Einreichung in die Obsidian Community-Plugin-Liste

Ziel: Aufnahme in die offizielle Plugin-Liste → danach in Obsidian über
*Settings → Community plugins → Browse* auffindbar und installierbar.

> **Hinweis:** Der frühere Weg (Fork von `obsidianmd/obsidian-releases` + Pull-Request
> an `community-plugins.json`) ist **abgeschaltet**. Manuelle PRs werden dort nicht mehr
> angenommen. Die Einreichung läuft jetzt über das **Developer Dashboard** mit
> automatischem Review.

## Vorbereitung (vor der Einreichung)

1. Änderungen committen und Tag pushen (Beispiel für 0.2.2):
   ```bash
   git add -A
   git commit -m "Prepare community submission"
   git tag 0.2.2
   git push origin main --tags
   ```
   (Branch ist `main`, nicht `master`.)
2. Warten, bis der GitHub-Action-Workflow das **veröffentlichte** Release
   mit `main.js`, `manifest.json`, `styles.css` als einzelne Assets erstellt hat
   (Tag exakt = `version` in manifest.json, ohne `v`-Präfix).
3. Repo auf **public** prüfen; LICENSE, README und `versions.json` müssen vorhanden sein.

## Einreichung über das Developer Dashboard

1. <https://community.obsidian.md/> öffnen und mit dem Obsidian-Account einloggen.
2. **GitHub-Konto verbinden.**
3. Repo `Micha12323/lifeweeks-obsidian` auswählen und einreichen.
4. **Automatischer Review** läuft sofort – Ergebnis meist innerhalb weniger Minuten.
5. Bei Fehlern: Details stehen im Dashboard. Im Plugin-Repo korrigieren, neuen Release
   erstellen, erneut einreichen.
6. Nach bestandenem Review ist das Plugin **innerhalb von 24 h** in der App suchbar.

## Nach der Freigabe

Updates brauchen **weder Dashboard noch PR**: einfach `version` in `manifest.json`
(und `versions.json`, `package.json`) erhöhen, Tag pushen, Release veröffentlichen –
Obsidian zieht die neue Version automatisch und prüft sie erneut per Auto-Review.

## Relevante Developer Policies (Kurzcheck)

Dieses Plugin arbeitet rein lokal auf Vault-Dateien:
- keine Telemetrie, keine Netzwerkzugriffe, kein eigener Update-Mechanismus, keine Werbung
- LICENSE (MIT) vorhanden
- kein Dateizugriff außerhalb des Vaults

Damit sind die kritischen Policy-Punkte erfüllt; keine zusätzliche README-Offenlegung nötig.
