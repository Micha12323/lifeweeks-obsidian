/*
 * Wochen-Index aus dem Obsidian MetadataCache – ersetzt FileStore/Storage-Index
 * der Browser-App. Frontmatter (color/title) kommt gratis aus dem Cache;
 * hasEntry wird über die Sections erkannt (Datei mit nur-Frontmatter hat
 * ausschließlich eine yaml-Section).
 */
import { App, TFile, TFolder } from "obsidian";
import { fileDateToWeekNum, weekKey } from "../core/dates";
import { parseWeekFilename, titleFromFilename } from "../core/filenames";
import type { TabInfo, TabWeeks } from "../core/types";

export function weeklyBasisPath(basePath: string): string {
  return `${basePath}/Weekly basis`;
}

export function tabFolderPath(basePath: string, tabName: string): string {
  return `${weeklyBasisPath(basePath)}/${tabName}`;
}

export function getFolder(app: App, path: string): TFolder | null {
  const f = app.vault.getAbstractFileByPath(path);
  return f instanceof TFolder ? f : null;
}

export function getFile(app: App, path: string): TFile | null {
  const f = app.vault.getAbstractFileByPath(path);
  return f instanceof TFile ? f : null;
}

/** Tabs = Unterordner von "Weekly basis/" (wie in der Browser-App: Tab-Label = Ordnername). */
export function listTabs(app: App, basePath: string): TabInfo[] {
  const root = getFolder(app, weeklyBasisPath(basePath));
  if (!root) return [];
  return root.children
    .filter((c): c is TFolder => c instanceof TFolder)
    .filter((f) => f.name !== "attachments")
    .map((f) => ({ name: f.name, folderPath: f.path }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
}

export function buildWeekIndex(
  app: App,
  basePath: string,
  tabName: string,
  birthDate: string,
  lifeExpectancy: number
): TabWeeks {
  const result: TabWeeks = {};
  const folder = getFolder(app, tabFolderPath(basePath, tabName));
  if (!folder || !birthDate) return result;

  for (const child of folder.children) {
    if (!(child instanceof TFile) || child.extension !== "md") continue;
    const fileDate = parseWeekFilename(child.name);
    if (!fileDate) continue;
    const n = fileDateToWeekNum(birthDate, fileDate, lifeExpectancy);
    if (n === null) continue;
    const wk = weekKey(birthDate, n);

    const cache = app.metadataCache.getFileCache(child);
    const fm = cache?.frontmatter ?? {};
    const color = typeof fm.color === "string" && fm.color ? fm.color : null;
    let title = typeof fm.title === "string" ? fm.title : "";
    if (!title) title = titleFromFilename(child.name);
    const hasEntry = (cache?.sections ?? []).some((s) => s.type !== "yaml");

    // Duplikate (gleiche Woche, mehrere Dateien): Datei mit Eintrag gewinnt
    const prev = result[wk];
    if (prev && prev.hasEntry && !hasEntry) continue;
    result[wk] = { color, hasEntry, title, path: child.path };
  }
  return result;
}
