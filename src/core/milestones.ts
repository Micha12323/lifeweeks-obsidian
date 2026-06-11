/*
 * Meilenstein-Berechnung (1000-Tage-Schritte, Schnapszahlen etc.) –
 * 1:1-Port aus lifeweeks.html (v0.40).
 */
import { dateToGridWeek } from "./dates";

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
): Map<number, string[]> {
  if (!birthDate) return new Map();
  const birth = new Date(birthDate);
  birth.setHours(0, 0, 0, 0);
  const maxWeeks = lifeExpectancy * 52;
  const result = new Map<number, string[]>();

  const fmtN = (n: number) =>
    n >= 1000000000
      ? (n / 1000000000).toLocaleString("de-DE", { maximumFractionDigits: 3 }) + " Mrd."
      : n >= 1000000
        ? (n / 1000000).toLocaleString("de-DE", { maximumFractionDigits: 3 }) + " Mio."
        : n.toLocaleString("de-DE");

  const add = (date: Date, lbl: string) => {
    const wk = dateToGridWeek(birthDate, date);
    if (wk < 0 || wk >= maxWeeks) return;
    if (!result.has(wk)) result.set(wk, []);
    if (!result.get(wk)!.includes(lbl)) result.get(wk)!.push(lbl);
  };

  // Tage: ×1000 + Schnapszahlen ab 3 Stellen
  const maxDays = lifeExpectancy * 365 + 25;
  for (const d of getNotables(maxDays, [1000], 3)) {
    const dt = new Date(birth);
    dt.setDate(dt.getDate() + d);
    add(dt, `${fmtN(d)} Tage`);
  }

  // Wochen: ×100 + Schnapszahlen ab 3 Stellen
  for (const w of getNotables(maxWeeks, [100], 3)) {
    const dt = new Date(birth);
    dt.setDate(dt.getDate() + w * 7);
    add(dt, `${fmtN(w)} Wochen`);
  }

  // Monate: ×100 + Schnapszahlen
  const maxMonths = lifeExpectancy * 12 + 2;
  for (const m of getNotables(maxMonths, [100], 3)) {
    const dt = new Date(birth);
    dt.setMonth(dt.getMonth() + m);
    add(dt, `${fmtN(m)} Monate`);
  }

  // Quartale: ×100 + Schnapszahlen ab 2 Stellen
  const maxQ = lifeExpectancy * 4 + 1;
  for (const q of getNotables(maxQ, [100], 2)) {
    const dt = new Date(birth);
    dt.setMonth(dt.getMonth() + q * 3);
    add(dt, `${fmtN(q)} Quartale`);
  }

  // Minuten: ×1.000.000 + Schnapszahlen ab 7 Stellen
  const maxMin = Math.ceil(lifeExpectancy * 365.25 * 1440);
  for (const m of getNotables(maxMin, [1000000], 7)) {
    const dt = new Date(birth.getTime() + m * 60000);
    add(dt, `${fmtN(m)} Minuten`);
  }

  // Sekunden: ×100.000.000 + Schnapszahlen ab 9 Stellen
  const maxSec = Math.ceil(lifeExpectancy * 365.25 * 86400);
  for (const s of getNotables(maxSec, [100000000], 9)) {
    const dt = new Date(birth.getTime() + s * 1000);
    add(dt, `${fmtN(s)} Sekunden`);
  }

  return result;
}
