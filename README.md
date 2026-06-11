# Life in Weeks – Obsidian-Plugin

Port der [Single-File-Browser-App](../lifeweeks.html) als natives Obsidian-Plugin. Rendert ein „Life in Weeks"-Grid (Standard: 90 Jahre × 52 Wochen = 4680 Zellen) über die Wochen- und Tagesnotizen im Vault.

## Features

| Feature | Bedienung |
|---|---|
| Wochennotiz öffnen | Kurzer Klick auf eine Zelle **mit** Notiz |
| Farbe + Titel setzen / Notiz anlegen | Klick auf leere Zelle, **Rechtsklick** auf belegte Zelle |
| Tagesansicht (Mo–So) + Wochen-Farbe | **Long-Press** (½ Sekunde) auf eine Zelle |
| Mehrfachauswahl + Bulk-Edit | Button **⊞ Mehrfach** + Drag-to-Select |
| Zeitraum auswählen | Button **📅 Zeitraum** (Von/Bis) |
| Zoom | Slider (Mitte = Fensterbreite, rechts = reinzoomen), **Strg+Mausrad**, **Pinch** (Mobile) |
| Tab anlegen | **+** in der Tab-Leiste – legt Ordner unter `Weekly basis/` an |
| Eigene Zeitachse pro Tab | ⚙ am aktiven Tab |
| Legende pro Tab | Editierbar (Farben, Labels, Reihenfolge, eigene Einträge) |
| Sprache | Folgt der Obsidian-Sprache (DE/EN voll, sonst EN-Fallback; Datums-/Wochentagsformate via `Intl` in **allen** Sprachen) |
| Öffnen-Modus | „Notizen öffnen in": Automatisch / Split rechts / Haupt-Tableiste |

## Datenstruktur im Vault

Identisch zur Browser-App – beide bleiben parallel nutzbar.

```
{Basisordner}/                  # Standard: Bibliothek/Diary
├─ Weekly basis/
│  ├─ {Tab1}/                   # Tab-Name = Ordnername
│  │  ├─ 2026-04-06-W14 Urlaub.md
│  │  └─ attachments/
│  └─ {Tab2}/…
└─ Daily basis/                 # flat (oder Daily basis/{Tab}/ pro Tab)
   └─ 2026-04-14.md
```

**Dateinamen:** `yyyy-mm-dd-Www[ Titel].md` (Wocheneinträge), `yyyy-mm-dd[ Titel].md` (Tageseinträge).
**Frontmatter** wird per `app.fileManager.processFrontMatter()` gepflegt – fremde Keys (z.B. `date`/`time`/`tags` in Alt-Dailies) bleiben **unberührt**.

## Bedienung im Detail

### Klick-Verhalten auf einer Zelle

| Aktion | Woche **mit** Notiz | Woche **ohne** Notiz |
|---|---|---|
| Kurzer Klick | öffnet die Notiz | Quick-Edit (Farbe/Titel/anlegen) |
| Rechtsklick | Quick-Edit zum Nachjustieren | Quick-Edit |
| Long-Press | Tagesansicht + Wochen-Palette | Tagesansicht + Wochen-Palette |

### Farbe nachträglich ändern

1. **Rechtsklick** auf die Zelle → Palette im Popover (Desktop)
2. **Long-Press** → Palette im Tages-Panel (auch Mobile)
3. In der geöffneten Notiz: `color`-Property im Frontmatter

### Mehrfachauswahl

1. **⊞ Mehrfach** im Header (oder **📅 Zeitraum** öffnen)
2. Über Zellen ziehen → blaue Ringe
3. Aktionsleiste unten: Farbe + Titel + Inhalt → **Auf N Wochen anwenden**
4. Leere Eingabe → markierte Notizen wandern in den **Papierkorb**

### Zoom

- Slider-Mitte (50) = Fensterbreite, links → alles sichtbar, rechts → bis 24 px Zellgröße
- Bei jeder Zoom-Änderung wird **auf die aktuelle Woche zentriert**
- **Strg+Mausrad** über dem Grid (Trackpad-Pinch am Desktop sendet ebenfalls Strg+Rad)
- **2-Finger-Pinch** in der Mobile-App

## Architektur

```
src/
├─ main.ts                 # Plugin-Klasse, View/Ribbon/Command/SettingTab
├─ settings.ts             # basePath, birthDate, lifeExpectancy, openMode, legends, tabConfigs
├─ view.tsx                # ItemView + React-Root (createRoot)
├─ i18n.ts                 # moment.locale() → DE/EN, Intl-Datumsformate
├─ core/                   # pure Logik – portiert aus lifeweeks.html
│  ├─ dates.ts             # rowMonday, weekStartDate, weekKey (UTC-Fix!), …
│  ├─ filenames.ts         # weekFilename, dailyFilename, buildWeekFileContent, …
│  ├─ milestones.ts        # computeMilestoneWeeks
│  ├─ types.ts
│  └─ dates.test.ts        # vitest – 15 Tests
├─ data/                   # Vault-Adapter (ersetzt FileStore/DirStore der Browser-App)
│  ├─ WeekIndex.ts         # baut TabWeeks aus MetadataCache
│  └─ DailyIndex.ts        # tolerantes Lesen, fremdes Frontmatter unberührt
└─ ui/                     # React-Komponenten
   ├─ App.tsx              # State + Schreib-Aktionen
   ├─ WeekGrid.tsx         # 4680 Zellen, memo, ein globaler Tooltip
   ├─ WeekCell             # inline in WeekGrid
   ├─ WeekQuickEdit.tsx    # Popover (Portal in document.body)
   ├─ DayPanel.tsx         # Long-Press: Mo–So + Wochen-Palette
   ├─ Legend.tsx           # editierbar pro Tab + Drag&Drop
   ├─ BulkActionBar.tsx
   ├─ TabSettingsModal.tsx # eigene Zeitachse, ownDailyBasis, Meilensteine
   ├─ DateRangeModal.tsx
   ├─ SetupScreen.tsx
   └─ constants.ts         # Palette, Legenden-Defaults
```

**Technologie:** TypeScript + esbuild, React 18 gebündelt (kein CDN). View-Updates über `metadataCache.changed` + `vault.create/delete/rename` (debounced 400 ms).

### Wichtige Designentscheidungen

- **Kein eingebetteter Markdown-Editor**: Wochennotizen öffnen sich nativ in Obsidian (Split/Tab) – damit funktionieren CodeMirror 6, Bilder-Paste, Templater, Backlinks gratis. CodeMirror 5 (wie in lifeweeks.html) würde mit Obsidians CM6 kollidieren.
- **`processFrontMatter` statt YAML-Rewrite**: schützt fremdes Frontmatter (Alt-Dailies mit `date`/`time`/`tags` werden nie zerstört).
- **Globaler Tooltip per Event-Delegation**: nur **ein** Tooltip-DOM-Knoten statt 4680.
- **Portale in `document.body`**: Obsidian-Leaves setzen `contain: strict`, dadurch würden `position: fixed`-Overlays sonst am (schmalen) Panel kleben.
- **weekKey-UTC-Bug aus der Browser-App ist im Port gefixt** (`localIso` statt `toISOString`).

## Entwicklung

```powershell
cd lifeweeks\obsidian-plugin
npm install
npm run dev      # Watch → test-vault/.obsidian/plugins/lifeweeks/
npm test         # vitest
npm run build    # Production-Build (tsc -noEmit + esbuild)
```

`test-vault/` enthält kopierte Realdaten (alle 3 Tabs, Emoji-Datei, Alt-Dailies, Legacy-`Beruf/`). Der Watch-Mode kopiert **nie** in den echten Vault.

## Deploy in den echten Vault

Das Plugin wird mit dem Skript [`deploy.ps1`](./deploy.ps1) installiert. Es kopiert nur 3 Dateien (`main.js`, `manifest.json`, `styles.css`) nach `MCB/.obsidian/plugins/lifeweeks/` – nichts weiter.

```powershell
cd C:\Users\MichaelChristianBaum\Documents\Zusätzliches\Personal\lifeweeks\obsidian-plugin
npm run build        # bauen
.\deploy.ps1         # in den MCB-Vault kopieren
```

Danach in Obsidian: **Einstellungen → Community-Plugins → Aktualisieren** (oder Obsidian neu laden / „Reload plugin without saving"). Beim ersten Start erscheint der Setup-Screen (Geburtsdatum, Lebenserwartung, Basisordner).

## Kompatibilität zur Browser-App

Dateiformate, Dateinamen und Frontmatter-Konventionen sind **identisch**. Eine Wochennotiz, die mit lifeweeks.html angelegt wurde, taucht im Plugin sofort auf – und umgekehrt. Beide Apps können parallel auf demselben Datenordner arbeiten.

## Mobile

Das Plugin ist `isDesktopOnly: false`. Long-Press, Pinch-Zoom und Quick-Edit funktionieren über Pointer-Events. Die File-System-Access-API-Lücke der Browser-App (kein iOS-Support, manuelle Verzeichniswahl) fällt damit weg.
