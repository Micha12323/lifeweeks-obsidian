import { describe, expect, it } from "vitest";
import { excerptFromMarkdown } from "./excerpt";

describe("excerptFromMarkdown", () => {
  it("entfernt Frontmatter und Überschriften-Rauten", () => {
    const md = '---\nweek: "Jahr 1, Woche 14"\ncolor: "#c97c3a"\n---\n\n# Urlaub\n\nAm Meer.';
    expect(excerptFromMarkdown(md)).toBe("Urlaub\n\nAm Meer.");
  });
  it("nur Frontmatter → leerer Text", () => {
    expect(excerptFromMarkdown('---\ndate: "14.04.2026"\n---\n')).toBe("");
  });
  it("zieht Leerzeilen zusammen und kürzt nach Zeilen", () => {
    const md = "a\n\n\n\nb\nc\nd\ne\nf\ng";
    expect(excerptFromMarkdown(md, 280, 4)).toBe("a\n\nb\nc …");
  });
  it("kürzt nach Zeichen an einer Wortgrenze", () => {
    expect(excerptFromMarkdown("eins zwei drei vier", 12)).toBe("eins zwei …");
  });
  it("Windows-Zeilenenden", () => {
    expect(excerptFromMarkdown("---\r\nx: 1\r\n---\r\nHallo\r\nWelt")).toBe("Hallo\nWelt");
  });
});
