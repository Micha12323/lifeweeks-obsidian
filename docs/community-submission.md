# Einreichung in die Obsidian Community-Plugin-Liste

Ziel: Aufnahme in <https://github.com/obsidianmd/obsidian-releases> → danach in Obsidian
über *Settings → Community plugins → Browse* auffindbar.

## Vorbereitung (vor dem PR)

1. Änderungen committen und Tag `0.2.2` pushen:
   ```bash
   git add -A
   git commit -m "Prepare community submission: English manifest description, publish release"
   git tag 0.2.2
   git push origin master --tags
   ```
2. Warten, bis der GitHub-Action-Workflow das **veröffentlichte** Release `0.2.2`
   mit `main.js`, `manifest.json`, `styles.css` als einzelne Assets erstellt hat.
3. Repo auf **public** prüfen.

## PR-Eintrag

Fork von `obsidianmd/obsidian-releases`, in `community-plugins.json` **ganz ans Ende**
der Liste anhängen (Komma nach dem bisher letzten Eintrag nicht vergessen):

```json
{
  "id": "lifeweeks",
  "name": "Life in Weeks",
  "author": "Michael Christian Baum",
  "description": "Render a life-in-weeks grid over your vault's weekly and daily notes. Click a cell to open its note, long-press for the day view.",
  "repo": "Micha12323/lifeweeks-obsidian"
}
```

Dann Pull-Request öffnen, das PR-Template wahrheitsgemäß ausfüllen, auf den Bot-Check
reagieren und den manuellen Review abwarten.

## Nach dem Merge

Updates brauchen keinen neuen PR – einfach `version` in `manifest.json` (und
`versions.json`, `package.json`) erhöhen, Tag pushen, Release veröffentlichen.
