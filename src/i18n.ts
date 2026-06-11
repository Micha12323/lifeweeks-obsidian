/*
 * i18n: UI-Texte (de/en, Fallback en) + locale-abhängige Datumsformate via Intl.
 * Die Obsidian-Sprache liegt in localStorage["language"] (null = Englisch).
 * Wichtig: Das DATEIFORMAT (Frontmatter week:/dates:, Dateinamen) bleibt
 * unabhängig von der UI-Sprache – Kompatibilität zur Browser-App.
 */

import { moment } from "obsidian";
import { weekStartDate } from "./core/dates";

export function obsidianLocale(): string {
  // 1) Obsidian setzt die moment-Locale auf die eingestellte Oberflächensprache
  try {
    const m = moment.locale();
    if (m) return m;
  } catch {
    /* z.B. in Tests ohne Obsidian */
  }
  // 2) Fallback: localStorage-Key (nur gesetzt, wenn Sprache je geändert wurde)
  try {
    const ls = window.localStorage.getItem("language");
    if (ls) return ls;
  } catch {
    /* ignore */
  }
  return navigator?.language || "en";
}

type Dict = Record<string, string>;

const DE: Dict = {
  age: "{years} Jahre, {weeks} Wochen",
  multiSelect: "⊞ Mehrfach",
  multiSelectTitle: "Mehrfachauswahl: Wochen markieren und gemeinsam bearbeiten",
  zoomTitle: "Zoom (auch Strg+Mausrad / Pinch) – zentriert auf die aktuelle Woche",
  dateRangeBtn: "📅 Zeitraum",
  dateRangeTitle: "Zeitraum auswählen",
  dateRangeHint: "Markiert alle Wochen im Zeitraum (Mehrfachauswahl).",
  from: "Von",
  to: "Bis",
  apply: "Auswählen",
  legendPast: "Vergangen",
  legendCurrent: "Diese Woche",
  legendFuture: "Zukunft",
  legendEntry: "Mit Eintrag",
  legendAddTitle: "Legendeneintrag hinzufügen",
  legendRename: "Klicken zum Umbenennen",
  legendNew: "Neu",
  counter: "Woche {cur} von {total} · {pct}% gelebt · {count} Einträge",
  selected: "{n} ausgewählt",
  yearWeek: "Jahr {y}, Woche {w}",
  birthday: "🎂 Geburtstag",
  weekEntry: "📝 Wocheneintrag",
  daysFull: "7 Tage vollständig",
  days: "{n} Tag(e)",
  milestonePrefix: "🎯 ",
  noColor: "Keine Farbe",
  customColor: "Eigene Farbe",
  close: "Schließen",
  titlePlaceholder: "Titel der Woche…",
  openNote: "📝 Notiz öffnen",
  createNote: "📝 Notiz anlegen + öffnen",
  dayOpen: "öffnen",
  dayCreate: "+ anlegen",
  dayOpenTitle: "Tagesnotiz öffnen",
  dayCreateTitle: "Tagesnotiz anlegen",
  weekNoteOpen: "📝 Wochennotiz öffnen",
  weekNoteCreate: "📝 Wochennotiz anlegen",
  bulkTitle: "Titel…",
  bulkContent: "Markdown-Inhalt (optional)…",
  bulkApply: "Auf {n} Wochen anwenden",
  bulkApplyOne: "Auf 1 Woche anwenden",
  bulkSaving: "Speichere…",
  bulkClear: "Auswahl aufheben",
  bulkHint: "⚠ Ohne Farbe und Inhalt werden bestehende Einträge gelöscht (in den Papierkorb).",
  bulkDeleted: "{n} Einträge in den Papierkorb verschoben.",
  bulkSaved: "{n} Wochen gespeichert.",
  bulkError: "Bulk-Aktion fehlgeschlagen nach {n} Wochen: {err}",
  errColor: "Farbe konnte nicht gespeichert werden: {err}",
  errTitle: "Titel konnte nicht gespeichert werden: {err}",
  errOpen: "Notiz konnte nicht geöffnet werden: {err}",
  errOpenDay: "Tagesnotiz konnte nicht geöffnet werden: {err}",
  errTab: "Tab-Ordner konnte nicht angelegt werden: {err}",
  noTabs: "Keine Tabs gefunden – Ordner unter „{path}/Weekly basis/“ anlegen oder + klicken.",
  newTabPlaceholder: "Neuer Tab…",
  addTabTitle: "Neuen Tab anlegen (Ordner unter Weekly basis/)",
  ownAxis: "Eigene Zeitachse",
  tabAxisTitle: "Zeitachse: {tab}",
  tabSettingsTitle: "Zeitachse dieses Tabs",
  useOwnAxis: "Eigene Zeitachse (statt globaler Einstellung)",
  showMilestones: "Meilensteine anzeigen (Tage, Wochen, Minuten …)",
  ownDaily: "Eigene Tages-Doku ({path})",
  sharedDaily: "Geteilte Tages-Doku: alle Tabs nutzen Daily basis/",
  startDate: "Startdatum",
  lifeExpYears: "Lebenserwartung / Laufzeit (Jahre)",
  period: "Zeitraum: {from} – {to}",
  cancel: "Abbrechen",
  save: "Speichern",
  setupTitle: "Life in Weeks – Einrichtung",
  setupInfo: "Tabs und Einträge werden aus dem Basisordner gelesen (Unterordner von „Weekly basis/“).",
  nameOptional: "Name (optional)",
  birthDateLabel: "Geburtsdatum",
  basePathLabel: "Basisordner im Vault",
  start: "Loslegen",
  appTitle: "Leben in Wochen",
  settingBasePath: "Basisordner",
  settingBasePathDesc: 'Vault-Ordner mit "Weekly basis/" und "Daily basis/" (z.B. Bibliothek/Diary)',
  settingBirthDate: "Geburtsdatum",
  settingBirthDateDesc: "Format JJJJ-MM-TT – bestimmt die erste Grid-Zeile",
  settingLifeExp: "Lebenserwartung (Jahre)",
  settingLifeExpDesc: "Anzahl der Jahreszeilen im Grid",
  settingName: "Name",
  settingNameDesc: "Anzeige im Header (optional)",
  settingOpenMode: "Notizen öffnen in",
  settingOpenModeDesc: "Wo Wochen-/Tagesnotizen geöffnet werden",
  openModeAuto: "Automatisch (nach Fensterbreite)",
  openModeSplit: "Split rechts (zweite Tab-Gruppe)",
  openModeTab: "Haupt-Tableiste",
};

const EN: Dict = {
  age: "{years} years, {weeks} weeks",
  multiSelect: "⊞ Multi-select",
  multiSelectTitle: "Multi-select: mark weeks and edit them together",
  zoomTitle: "Zoom (also Ctrl+wheel / pinch) – centered on the current week",
  dateRangeBtn: "📅 Date range",
  dateRangeTitle: "Select date range",
  dateRangeHint: "Selects all weeks in the range (multi-select).",
  from: "From",
  to: "To",
  apply: "Select",
  legendPast: "Past",
  legendCurrent: "This week",
  legendFuture: "Future",
  legendEntry: "With entry",
  legendAddTitle: "Add legend item",
  legendRename: "Click to rename",
  legendNew: "New",
  counter: "Week {cur} of {total} · {pct}% lived · {count} entries",
  selected: "{n} selected",
  yearWeek: "Year {y}, Week {w}",
  birthday: "🎂 Birthday",
  weekEntry: "📝 Week entry",
  daysFull: "7 days complete",
  days: "{n} day(s)",
  milestonePrefix: "🎯 ",
  noColor: "No color",
  customColor: "Custom color",
  close: "Close",
  titlePlaceholder: "Week title…",
  openNote: "📝 Open note",
  createNote: "📝 Create + open note",
  dayOpen: "open",
  dayCreate: "+ create",
  dayOpenTitle: "Open daily note",
  dayCreateTitle: "Create daily note",
  weekNoteOpen: "📝 Open week note",
  weekNoteCreate: "📝 Create week note",
  bulkTitle: "Title…",
  bulkContent: "Markdown content (optional)…",
  bulkApply: "Apply to {n} weeks",
  bulkApplyOne: "Apply to 1 week",
  bulkSaving: "Saving…",
  bulkClear: "Clear selection",
  bulkHint: "⚠ Without color and content, existing entries are deleted (moved to trash).",
  bulkDeleted: "{n} entries moved to trash.",
  bulkSaved: "{n} weeks saved.",
  bulkError: "Bulk action failed after {n} weeks: {err}",
  errColor: "Could not save color: {err}",
  errTitle: "Could not save title: {err}",
  errOpen: "Could not open note: {err}",
  errOpenDay: "Could not open daily note: {err}",
  errTab: "Could not create tab folder: {err}",
  noTabs: "No tabs found – create folders under “{path}/Weekly basis/” or click +.",
  newTabPlaceholder: "New tab…",
  addTabTitle: "Create a new tab (folder under Weekly basis/)",
  ownAxis: "Own timeline",
  tabAxisTitle: "Timeline: {tab}",
  tabSettingsTitle: "Timeline of this tab",
  useOwnAxis: "Own timeline (instead of global setting)",
  showMilestones: "Show milestones (days, weeks, minutes …)",
  ownDaily: "Own daily docs ({path})",
  sharedDaily: "Shared daily docs: all tabs use Daily basis/",
  startDate: "Start date",
  lifeExpYears: "Life expectancy / duration (years)",
  period: "Period: {from} – {to}",
  cancel: "Cancel",
  save: "Save",
  setupTitle: "Life in Weeks – Setup",
  setupInfo: "Tabs and entries are read from the base folder (subfolders of “Weekly basis/”).",
  nameOptional: "Name (optional)",
  birthDateLabel: "Birth date",
  basePathLabel: "Base folder in vault",
  start: "Get started",
  appTitle: "Life in Weeks",
  settingBasePath: "Base folder",
  settingBasePathDesc: 'Vault folder containing "Weekly basis/" and "Daily basis/"',
  settingBirthDate: "Birth date",
  settingBirthDateDesc: "Format YYYY-MM-DD – determines the first grid row",
  settingLifeExp: "Life expectancy (years)",
  settingLifeExpDesc: "Number of year rows in the grid",
  settingName: "Name",
  settingNameDesc: "Shown in the header (optional)",
  settingOpenMode: "Open notes in",
  settingOpenModeDesc: "Where week/daily notes are opened",
  openModeAuto: "Automatic (by window width)",
  openModeSplit: "Split right (second tab group)",
  openModeTab: "Main tab bar",
};

const LANGS: Record<string, Dict> = { de: DE, en: EN };

export function t(key: string, vars?: Record<string, string | number>): string {
  const locale = obsidianLocale();
  const dict = LANGS[locale.split("-")[0]] ?? EN;
  let s = dict[key] ?? EN[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

/** Datum im Format der Obsidian-Sprache (alle Locales via Intl). */
export function fmtDateLocal(d: Date): string {
  return d.toLocaleDateString(obsidianLocale(), { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Kurzer Wochentag + Datum, z.B. "Mo 06.04." bzw. "Mon 04/06". */
export function weekdayLabel(d: Date): string {
  const locale = obsidianLocale();
  const wd = d.toLocaleDateString(locale, { weekday: "short" });
  const dm = d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
  return `${wd} ${dm}`;
}

/** Anzeige-Label einer Grid-Woche in der UI-Sprache (Dateiformat bleibt deutsch!). */
export function displayWeekLabel(bd: string, n: number): { life: string; dates: string } {
  const start = weekStartDate(bd, n);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return {
    life: t("yearWeek", { y: Math.floor(n / 52), w: (n % 52) + 1 }),
    dates: `${fmtDateLocal(start)} – ${fmtDateLocal(end)}`,
  };
}
