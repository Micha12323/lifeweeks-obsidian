# Life in Weeks – Obsidian Plugin

A "Life in Weeks" grid rendered over the weekly and daily notes in your vault. Each cell is one week of your life – click it to open or create the matching note. Great for journaling and for tracking separate timelines (children, pets, relationships, jobs …) side by side.

- Click a cell to open its note, long-press for the day view
- Set weekly colors and titles
- Multi-select to edit many weeks at once
- Add tabs for separate grids, each with its own legend

![Life in Weeks grid in Obsidian](docs/grid.png)

## Installation

1. Open **Settings → Community plugins** and turn off restricted mode if needed
2. **Browse** → search for **"Life in Weeks"**
3. **Install** → **Enable**
4. Click the calendar icon in the left sidebar

<details>
<summary>Manual install (fallback)</summary>

1. Download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/Micha12323/lifeweeks-obsidian/releases/latest)
2. Copy them into `<your-vault>/.obsidian/plugins/lifeweeks/`
3. **Settings → Community plugins → Reload**, then enable **Life in Weeks**

</details>

## First start

A setup screen asks for:

- **Birth date** (`YYYY-MM-DD`)
- **Life expectancy** in years (number of grid rows, default 90)
- **Base folder** in your vault (default `Bibliothek/Diary`) – where `Weekly basis/` and `Daily basis/` live

Tabs are auto-detected from the subfolders of `Weekly basis/` – no extra configuration needed.

## Usage

| Action | Cell **with** note | Cell **without** note |
|---|---|---|
| Short click | Opens the note | Quick-Edit (color / title / create) |
| Right-click | Quick-Edit | Quick-Edit |
| Long-press (½ s) | Day view (Mon–Sun) + weekly palette | Day view + weekly palette |

- **Multi-select:** the **⊞** button or **📅 Date range**, then drag across cells and edit them together (empty input moves the selected notes to the trash).
- **Zoom:** slider, **Ctrl+wheel**, or pinch on mobile – always centered on the current week. A button next to the slider cycles fit-width → fit-height → 1:1.
- **Tabs:** **+** in the tab bar creates a folder under `Weekly basis/`; **⚙** gives a tab its own timeline.
- **Language:** follows the Obsidian UI language (DE/EN); date formats adapt to your locale.
- **Open mode:** *Settings → "Open notes in"* – Automatic / Split right / Main tab bar.

## Data structure

Notes are plain Markdown, so the data stays usable outside the plugin.

```
{base folder}/                 # default: Bibliothek/Diary
├─ Weekly basis/
│  ├─ {Tab}/                   # tab name = folder name
│  │  └─ 2026-04-06-W14 Vacation.md
│  └─ …
└─ Daily basis/                # 2026-04-14.md
```

**File names:** `yyyy-mm-dd-Www[ Title].md` (weekly), `yyyy-mm-dd[ Title].md` (daily). Frontmatter is edited via `processFrontMatter()`, so foreign keys (`date`, `time`, `tags` …) are never touched.

```markdown
---
week: "Jahr 1, Woche 14"
dates: "06.04.2026 – 12.04.2026"
color: "#c97c3a"
title: "Vacation"
---

Markdown content here…
```

> The YAML labels (`week`, `dates`) are in German for historical reasons. The UI itself is fully translated.

## Mobile

Same build runs on phone and desktop (`isDesktopOnly: false`). Long-press, pinch zoom and Quick-Edit work via pointer events.

## License

MIT – see [LICENSE](./LICENSE).
