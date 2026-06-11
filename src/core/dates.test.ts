import { describe, expect, it } from "vitest";
import {
  complementaryHex,
  currentWeekNum,
  dateToGridWeek,
  fileDateToWeekNum,
  isoWeek,
  localIso,
  rowMonday,
  weekKey,
  weekLabel,
  weekStartDate,
} from "./dates";
import { parseWeekFilename, titleFromFilename, weekFilename } from "./filenames";

const BD = "1991-11-10";

describe("rowMonday / weekStartDate", () => {
  it("liefert den Montag der Woche mit dem 1. Januar", () => {
    // 1. Januar 1991 war ein Dienstag → Montag = 31.12.1990
    const mon = rowMonday(1991, 0);
    expect(localIso(mon)).toBe("1990-12-31");
    expect(mon.getDay()).toBe(1);
  });

  it("jede Zeile beginnt an einem Montag", () => {
    for (const y of [0, 1, 10, 34, 89]) {
      expect(weekStartDate(BD, y * 52).getDay()).toBe(1);
    }
  });
});

describe("weekKey (UTC-Fix)", () => {
  it("liefert das lokale Datum des Wochenbeginns – kein UTC-Versatz", () => {
    // Die alte toISOString-Variante lieferte bei UTC+1 "1990-12-30"
    expect(weekKey(BD, 0)).toBe("1990-12-31");
  });

  it("ist konsistent mit weekStartDate für beliebige Wochen", () => {
    for (const n of [0, 51, 52, 100, 520, 1820, 4679]) {
      expect(weekKey(BD, n)).toBe(localIso(weekStartDate(BD, n)));
    }
  });
});

describe("isoWeek", () => {
  it("kennt ISO-Jahreswechsel", () => {
    expect(isoWeek(new Date(1990, 11, 31))).toBe(1); // Mo 31.12.1990 = KW1/1991
    expect(isoWeek(new Date(2026, 0, 1))).toBe(1); // Do 01.01.2026 = KW1
    expect(isoWeek(new Date(2027, 0, 1))).toBe(53); // Fr 01.01.2027 = KW53/2026
  });
});

describe("weekFilename", () => {
  it("erzeugt das Format yyyy-mm-dd-Www", () => {
    expect(weekFilename(BD, 0, null)).toBe("1990-12-31-W01.md");
  });

  it("ersetzt verbotene Zeichen im Titel", () => {
    expect(weekFilename(BD, 0, 'A/B:C"D')).toBe("1990-12-31-W01 A-B-C-D.md");
  });

  it("Roundtrip: parseWeekFilename + titleFromFilename", () => {
    const name = weekFilename(BD, 520, "Urlaub");
    const d = parseWeekFilename(name);
    expect(d && localIso(d)).toBe(weekKey(BD, 520));
    expect(titleFromFilename(name)).toBe("Urlaub");
    expect(titleFromFilename("2026-04-27-W18 ⛵🪢.md")).toBe("⛵🪢");
  });
});

describe("fileDateToWeekNum", () => {
  it("Roundtrip weekStartDate → n", () => {
    for (const n of [0, 1, 51, 52, 53, 519, 520, 1000, 4679]) {
      expect(fileDateToWeekNum(BD, weekStartDate(BD, n), 90)).toBe(n);
    }
  });

  it("ordnet Jahresgrenzen korrekt zu (Dateidatum im Vorjahr)", () => {
    // Woche 52 (n=52) der zweiten Zeile kann am Jahresende der ersten liegen
    const d = weekStartDate(BD, 52);
    expect(fileDateToWeekNum(BD, d, 90)).toBe(52);
  });

  it("lehnt Daten außerhalb des Grids ab", () => {
    expect(fileDateToWeekNum(BD, new Date(1980, 0, 1), 90)).toBeNull();
    expect(fileDateToWeekNum(BD, new Date(2150, 0, 1), 90)).toBeNull();
  });
});

describe("dateToGridWeek", () => {
  it("findet die Woche für Wochenbeginn und Wochenmitte", () => {
    for (const n of [0, 51, 52, 100, 520, 1820]) {
      const start = weekStartDate(BD, n);
      expect(dateToGridWeek(BD, start)).toBe(n);
      const mid = new Date(start);
      mid.setDate(mid.getDate() + 3);
      expect(dateToGridWeek(BD, mid)).toBe(n);
    }
  });
});

describe("currentWeekNum", () => {
  it("heutiges Datum liegt in der gefundenen Woche", () => {
    const today = new Date(2026, 5, 11); // 11.06.2026
    const n = currentWeekNum(BD, today);
    expect(n).toBeGreaterThan(0);
    const start = weekStartDate(BD, n);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    expect(today >= start && today < end).toBe(true);
  });
});

describe("weekLabel / complementaryHex", () => {
  it("weekLabel formatiert deutsch", () => {
    const l = weekLabel(BD, 0);
    expect(l.life).toBe("Jahr 0, Woche 1");
    expect(l.dates).toBe("31.12.1990 – 06.01.1991");
  });

  it("complementaryHex invertiert", () => {
    expect(complementaryHex("#ffffff")).toBe("#000000");
    expect(complementaryHex("#c97c3a")).toBe("#3683c5");
    expect(complementaryHex(null)).toBe("#000000");
  });
});
