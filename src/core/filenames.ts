/*
 * Dateinamens- und Frontmatter-Konventionen – Port aus lifeweeks.html (v0.40).
 * Format Wochennotiz: "yyyy-mm-dd-Www[ Titel].md" (dd = Wochenbeginn, Www = ISO-KW).
 * Die Formate bleiben identisch zur Browser-App, damit beide parallel nutzbar sind.
 */
import { fmt, isoWeek, weekStartDate } from "./dates";
import type { WeekLabel } from "./types";

export const WEEK_FILE_RE = /^(\d{4})-(\d{2})-(\d{2})-W\d{2}/;
export const DAILY_FILE_RE = /^(\d{4}-\d{2}-\d{2})/;

export function sanitizeTitle(title?: string | null): string {
  const t = (title ?? "").trim();
  return t ? t.replace(/[\\/:*?"<>|]/g, "-") : "";
}

export function weekDatePrefix(bd: string, n: number): string {
  const s = weekStartDate(bd, n);
  const yyyy = String(s.getFullYear());
  const mm = String(s.getMonth() + 1).padStart(2, "0");
  const dd = String(s.getDate()).padStart(2, "0");
  const ww = String(isoWeek(s)).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}-W${ww}`;
}

export function weekFilename(bd: string, n: number, title?: string | null): string {
  const safe = sanitizeTitle(title);
  return `${weekDatePrefix(bd, n)}${safe ? " " + safe : ""}.md`;
}

/** Datum (lokal) aus einem Wochen-Dateinamen, oder null wenn kein Wochenformat. */
export function parseWeekFilename(name: string): Date | null {
  const m = name.match(WEEK_FILE_RE);
  if (!m) return null;
  return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
}

/** Titel-Fallback aus dem Dateinamen (Teil nach dem Datums-Prefix). */
export function titleFromFilename(name: string): string {
  return name
    .replace(WEEK_FILE_RE, "")
    .replace(/\.md$/, "")
    .trim();
}

/** Dateiname Tagesnotiz: "yyyy-mm-dd[ Titel].md" */
export function dailyFilename(iso: string, title?: string | null): string {
  const safe = sanitizeTitle(title);
  return `${iso}${safe ? " " + safe : ""}.md`;
}

/** Titel-Fallback aus dem Daily-Dateinamen (Teil nach dem Datum). */
export function dailyTitleFromFilename(name: string): string {
  return name
    .replace(DAILY_FILE_RE, "")
    .replace(/\.md$/, "")
    .trim();
}

/** Frontmatter + Body für eine neue Tagesnotiz (identisch zur Browser-App). */
export function buildDailyContent(
  iso: string,
  color: string | null,
  title: string | null,
  content: string
): string {
  const d = new Date(iso + "T00:00:00");
  const l = ["---", `date: "${fmt(d)}"`];
  if (color) l.push(`color: "${color}"`);
  if (title?.trim()) l.push(`title: "${escYaml(title.trim())}"`);
  l.push("---", "");
  return l.join("\n") + (content || "");
}

function escYaml(v: string): string {
  return String(v ?? "").replace(/"/g, '\\"');
}

/** Frontmatter + Body für eine neue Wochennotiz (identisch zur Browser-App). */
export function buildWeekFileContent(
  label: WeekLabel,
  color: string | null,
  title: string | null,
  content: string
): string {
  const l = ["---", `week: "${label.life}"`, `dates: "${label.dates}"`];
  if (color) l.push(`color: "${color}"`);
  if (title?.trim()) l.push(`title: "${escYaml(title.trim())}"`);
  l.push("---", "");
  return l.join("\n") + (content || "");
}
