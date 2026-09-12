/*
 * Meilenstein-Berechnung (1000-Tage-Schritte, Schnapszahlen etc.) –
 * Port aus lifeweeks.html (v0.40). Liefert Zahl + Einheit; die Beschriftung
 * in der UI-Sprache macht formatMilestone() in i18n.ts.
 */
import { dateToGridWeek, parseLocalDate } from "./dates";

export type MilestoneUnit = "days" | "weeks" | "months" | "quarters" | "minutes" | "seconds";
export interface Milestone {
  n: number;
  unit: MilestoneUnit;
}

function getNotables(max: number, steps: number[], minSchnapzDigits: number): number[] {
  const s = new Set<number>();
  for (const step of steps) for (let n = step; n <= max; n += step) s.add(n);
  for (let digits = minSchnapzDigits; digits <= 12; digits++) {
    for (let d = 1; d <= 9; d++) {
      const n = parseInt(String(d).repeat(digits));
      if (n > 0 && n <= max) s.add(n);
    }
    let seq = "";
    for (let i = 1; i <= digits && i <= 9; i++) seq += i;
    if (seq.length === digits) {
      const n = parseInt(seq);
      if (n > 0 && n <= max) s.add(n);
    }
  }
  return [...s].sort((a, b) => a - b);
}

export function computeMilestoneWeeks(
  birthDate: string,
  lifeExpectancy: number
): Map<number, Milestone[]> {
  if (!birthDate) return new Map();
  const birth = parseLocalDate(birthDate);
  const maxWeeks = lifeExpectancy * 52;
  const result = new Map<number, Milestone[]>();

  const add = (date: Date, n: number, unit: MilestoneUnit) => {
    const wk = dateToGridWeek(birthDate, date);
    if (wk < 0 || wk >= maxWeeks) return;
    if (!result.has(wk)) result.set(wk, []);
    const list = result.get(wk)!;
    if (!list.some((m) => m.n === n && m.unit === unit)) list.push({ n, unit });
  };

  // Tage: ×1000 + Schnapszahlen ab 3 Stellen
  const maxDays = lifeExpectancy * 365 + 25;
  for (const d of getNotables(maxDays, [1000], 3)) {
    const dt = new Date(birth);
    dt.setDate(dt.getDate() + d);
    add(dt, d, "days");
  }

  // Wochen: ×100 + Schnapszahlen ab 3 Stellen
  for (const w of getNotables(maxWeeks, [100], 3)) {
    const dt = new Date(birth);
    dt.setDate(dt.getDate() + w * 7);
    add(dt, w, "weeks");
  }

  // Monate: ×100 + Schnapszahlen
  const maxMonths = lifeExpectancy * 12 + 2;
  for (const m of getNotables(maxMonths, [100], 3)) {
    const dt = new Date(birth);
    dt.setMonth(dt.getMonth() + m);
    add(dt, m, "months");
  }

  // Quartale: ×100 + Schnapszahlen ab 2 Stellen
  const maxQ = lifeExpectancy * 4 + 1;
  for (const q of getNotables(maxQ, [100], 2)) {
    const dt = new Date(birth);
    dt.setMonth(dt.getMonth() + q * 3);
    add(dt, q, "quarters");
  }

  // Minuten: ×1.000.000 + Schnapszahlen ab 7 Stellen
  const maxMin = Math.ceil(lifeExpectancy * 365.25 * 1440);
  for (const m of getNotables(maxMin, [1000000], 7)) {
    const dt = new Date(birth.getTime() + m * 60000);
    add(dt, m, "minutes");
  }

  // Sekunden: ×100.000.000 + Schnapszahlen ab 9 Stellen
  const maxSec = Math.ceil(lifeExpectancy * 365.25 * 86400);
  for (const s of getNotables(maxSec, [100000000], 9)) {
    const dt = new Date(birth.getTime() + s * 1000);
    add(dt, s, "seconds");
  }

  return result;
}
