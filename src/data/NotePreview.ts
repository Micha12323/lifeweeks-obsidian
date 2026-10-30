/*
 * Liest Notizen für die Hover-Vorschau (Desktop). cachedRead + kleiner Cache
 * nach Pfad und Änderungszeit, damit schnelles Hin-und-Her-Hovern billig bleibt.
 */
import { App, TFile } from "obsidian";
import { excerptFromMarkdown } from "../core/excerpt";

export type PreviewFn = (path: string) => Promise<string>;

export function createPreviewReader(app: App): PreviewFn {
  const cache = new Map<string, { mtime: number; text: string }>();
  return async (path: string) => {
    const file = app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) return "";
    const hit = cache.get(path);
    if (hit && hit.mtime === file.stat.mtime) return hit.text;
    const text = excerptFromMarkdown(await app.vault.cachedRead(file));
    cache.set(path, { mtime: file.stat.mtime, text });
    if (cache.size > 200) cache.delete(cache.keys().next().value as string);
    return text;
  };
}
