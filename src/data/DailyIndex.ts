/*
 * Tages-Index aus "Daily basis/" – tolerantes Lesen: JEDE Markdown-Datei mit
 * Datums-Prefix "yyyy-mm-dd" zählt als Tageseintrag, auch Alt-Notizen mit
 * abweichendem Frontmatter (date/time/tags statt color/title). Titel-Fallback
 * kommt aus dem Dateinamen. Es wird hier nie in fremde Frontmatter geschrieben.
 */
import { App, TFile } from "obsidian";
import { DAILY_FILE_RE, dailyTitleFromFilename } from "../core/filenames";
import { getFolder } from "./WeekIndex";

export interface DayData {
  color: string | null;
  title: string;
  path: string;
}

/** iso (yyyy-mm-dd) → Daten */
export type DailyIdx = Record<string, DayData>;

export function dailyBasisPath(basePath: string, tabName?: string | null): string {
  return tabName ? `${basePath}/Daily basis/${tabName}` : `${basePath}/Daily basis`;
}

export function buildDailyIndex(app: App, folderPath: string): DailyIdx {
  const result: DailyIdx = {};
  const folder = getFolder(app, folderPath);
  if (!folder) return result;

  for (const child of folder.children) {
    if (!(child instanceof TFile) || child.extension !== "md") continue;
    const m = child.name.match(DAILY_FILE_RE);
    if (!m) continue;
    const iso = m[1];

    const fm = app.metadataCache.getFileCache(child)?.frontmatter ?? {};
    const color = typeof fm.color === "string" && fm.color ? fm.color : null;
    let title = typeof fm.title === "string" ? fm.title : "";
    if (!title) title = dailyTitleFromFilename(child.name);

    // Bei mehreren Dateien pro Tag gewinnt die mit Titel
    const prev = result[iso];
    if (prev && prev.title && !title) continue;
    result[iso] = { color, title, path: child.path };
  }
  return result;
}
