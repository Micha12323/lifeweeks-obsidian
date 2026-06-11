/*
 * Datums-Logik – 1:1-Port aus lifeweeks.html (v0.40).
 * Koordinatensystem: Grid startet am 1. Januar des Geburtsjahres, jede Zeile =
 * 1 Jahr (52 Wochen), Wochenanker = Montag der Woche, die den 1. Januar enthält.
 * Alle ISO-Strings werden lokal erzeugt (localIso) – niemals toISOString (UTC-Versatz).
 */
import type { WeekLabel } from "./types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function gridStart(bd: string): Date {
  return new Date(new Date(bd).getFullYear(), 0, 1);
}

/** Montag der Woche, die den 1. Januar des jeweiligen Jahres enthält (ISO-Ausrichtung). */
export function rowMonday(birthYear: number, y: number): Date {
  const jan1 = new Date(birthYear + y, 0, 1);
  const dow = jan1.getDay() || 7; // 1=Mo … 7=So
  const mon = new Date(jan1);
  mon.setDate(jan1.getDate() - (dow - 1));
  return mon;
}

export function weekStartDate(bd: string, n: number): Date {
  const birthYear = new Date(bd).getFullYear();
  const y = Math.floor(n / 52);
  const w = n % 52;
  const base = new Date(rowMonday(birthYear, y));
  base.setDate(base.getDate() + w * 7);
  return base;
}

export function localIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Wochenschlüssel = lokales ISO-Datum des Wochenbeginns.
 * Fix gegenüber der Browser-App: localIso statt toISOString – das alte
 * toISOString lieferte bei UTC+1/+2 einen Tag zu früh (siehe PROJEKT.md).
 */
export function weekKey(bd: string, n: number): string {
  return localIso(weekStartDate(bd, n));
}

export function currentWeekNum(bd: string, today: Date = new Date()): number {
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  const birthYear = new Date(bd).getFullYear();
  const approxY = t.getFullYear() - birthYear;
  for (let y = Math.max(0, approxY - 1); y <= approxY + 1; y++) {
    const mon = rowMonday(birthYear, y);
    for (let w = 0; w < 52; w++) {
      const start = new Date(mon);
      start.setDate(mon.getDate() + w * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      if (t >= start && t < end) return y * 52 + w;
    }
  }
  return -1;
}

export function birthdayWeekNum(bd: string): number {
  const diff = new Date(bd).getTime() - gridStart(bd).getTime();
  return diff < 0 ? 0 : Math.floor(diff / WEEK_MS);
}

export function actualAge(bd: string, now: Date = new Date()): { years: number; weeks: number } {
  const diff = now.getTime() - new Date(bd).getTime();
  if (diff < 0) return { years: 0, weeks: 0 };
  const w = Math.floor(diff / WEEK_MS);
  return { years: Math.floor(w / 52), weeks: w % 52 };
}

export function fmt(d: Date): string {
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function complementaryHex(hex: string | null): string {
  if (!hex || !hex.startsWith("#")) return "#000000";
  const h =
    hex.length === 4
      ? hex
          .slice(1)
          .split("")
          .map((c) => c + c)
          .join("")
      : hex.slice(1);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `#${(255 - r).toString(16).padStart(2, "0")}${(255 - g)
    .toString(16)
    .padStart(2, "0")}${(255 - b).toString(16).padStart(2, "0")}`;
}

export const DE_DAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
export const DE_DFULL = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

export interface DayInfo {
  date: Date;
  iso: string;
  short: string;
  full: string;
  label: string;
}

/** Die 7 Tage (Mo–So) der Grid-Woche n. */
export function dayDates(bd: string, n: number): DayInfo[] {
  const start = weekStartDate(bd, n);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const iso = localIso(d);
    const dow = d.getDay();
    return {
      date: d,
      iso,
      short: DE_DAYS[dow],
      full: DE_DFULL[dow],
      label: `${DE_DAYS[dow]} ${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.`,
    };
  });
}

export function weekLabel(bd: string, n: number): WeekLabel {
  const s = weekStartDate(bd, n);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  return {
    dates: `${fmt(s)} – ${fmt(e)}`,
    life: `Jahr ${Math.floor(n / 52)}, Woche ${(n % 52) + 1}`,
  };
}

/** ISO-Kalenderwoche (für Dateinamen – Grid-Wochen ≠ ISO-Wochen!) */
export function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  return Math.ceil(((t.getTime() - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7);
}

/**
 * Findet die Grid-Woche für ein Datum, unter Berücksichtigung der jährlichen
 * rowMonday-Verschiebungen.
 */
export function dateToGridWeek(birthDate: string, date: Date): number {
  const approxY = Math.max(0, date.getFullYear() - new Date(birthDate).getFullYear() - 1);
  for (let y = approxY; y <= approxY + 3; y++) {
    const yStart = weekStartDate(birthDate, y * 52);
    const yEnd = weekStartDate(birthDate, (y + 1) * 52);
    if (date >= yStart && date < yEnd) {
      const w = Math.floor((date.getTime() - yStart.getTime()) / WEEK_MS);
      return y * 52 + Math.max(0, Math.min(51, w));
    }
  }
  return -1;
}

/**
 * Ordnet das Datum aus einem Wochen-Dateinamen einer Grid-Woche zu
 * (Logik aus dem Verzeichnis-Import der Browser-App: rowMonday-Rundung,
 * Jahresgrenze via zweitem Kandidaten).
 */
export function fileDateToWeekNum(
  birthDate: string,
  fileDate: Date,
  maxYears: number
): number | null {
  const birthYear = new Date(birthDate).getFullYear();
  const year = fileDate.getFullYear();
  for (const yTry of [year - birthYear, year - birthYear + 1]) {
    if (yTry < 0 || yTry >= maxYears) continue;
    const mon = rowMonday(birthYear, yTry);
    const w = Math.round((fileDate.getTime() - mon.getTime()) / WEEK_MS);
    if (w >= 0 && w < 52) return yTry * 52 + w;
  }
  return null;
}
