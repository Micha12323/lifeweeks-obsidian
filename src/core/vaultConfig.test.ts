import { describe, expect, it } from "vitest";
import { parseVaultConfig, sameVaultConfig, serializeVaultConfig, vaultConfigPath } from "./vaultConfig";

const CFG = {
  legends: {
    Beruf: {
      labels: { past: "Vergangen" },
      colors: { past: "#d4cec8" },
      hidden: [],
      order: ["past", "1785222999364"],
      extras: [{ id: "1785222999364", color: "#3692ba", label: "Grundschule" }],
    },
  },
  tabConfigs: { Kind: { birthDate: "2020-05-01", lifeExpectancy: 18, showMilestones: true, ownDailyBasis: true } },
};

describe("vaultConfig", () => {
  it("Roundtrip serialize → parse ist verlustfrei", () => {
    const text = serializeVaultConfig(CFG);
    expect(text.startsWith("---\nlifeweeks: config\n---\n")).toBe(true);
    expect(parseVaultConfig(text)).toEqual(CFG);
  });

  it("ohne JSON-Block oder mit kaputtem JSON → null", () => {
    expect(parseVaultConfig("# nur Text")).toBeNull();
    expect(parseVaultConfig("```json\n{ kaputt\n```")).toBeNull();
  });

  it("fehlende Teile werden mit leeren Objekten aufgefüllt", () => {
    expect(parseVaultConfig("```json\n{\"legends\": {\"A\": {}}}\n```")).toEqual({
      legends: { A: {} },
      tabConfigs: {},
    });
  });

  it("sameVaultConfig vergleicht inhaltlich", () => {
    expect(sameVaultConfig(CFG, JSON.parse(JSON.stringify(CFG)))).toBe(true);
    expect(sameVaultConfig(CFG, { ...CFG, tabConfigs: {} })).toBe(false);
  });

  it("Pfad liegt direkt im Basisordner", () => {
    expect(vaultConfigPath("Bibliothek/Diary")).toBe("Bibliothek/Diary/Life in Weeks Config.md");
  });
});
