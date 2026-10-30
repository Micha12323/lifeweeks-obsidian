/*
 * Geräteübergreifende Einstellungen (Legenden + Tab-Konfiguration) als
 * Markdown-Datei IM VAULT, damit sie über Obsidian Sync / Remotely Save /
 * iCloud … mitwandern. Die Plugin-eigene data.json wird nicht synchronisiert
 * (liegt in .obsidian/plugins/) und dient nur noch als lokaler Cache.
 *
 * Markdown statt .json, weil Obsidian Sync fremde Dateitypen standardmäßig
 * NICHT überträgt. Die Daten stehen in einem ```json-Codeblock.
 */
import type { LegendState, TabConfig } from "./types";

export const VAULT_CONFIG_FILENAME = "Life in Weeks Config.md";

export interface VaultConfig {
  legends: Record<string, LegendState>;
  tabConfigs: Record<string, TabConfig>;
}

export function vaultConfigPath(basePath: string): string {
  return `${basePath}/${VAULT_CONFIG_FILENAME}`;
}

const HEADER = [
  "---",
  "lifeweeks: config",
  "---",
  "",
  "Diese Datei wird vom Plugin **Life in 4k Weeks Calendar** verwaltet (Legenden und Tab-Einstellungen aller Tabs).",
  "Sie liegt bewusst im Vault, damit sie mit auf andere Geräte synchronisiert wird. Nicht von Hand bearbeiten.",
  "",
  "This file is managed by the **Life in 4k Weeks Calendar** plugin (legends and tab settings of all tabs).",
  "It lives in the vault on purpose so it syncs to your other devices. Do not edit by hand.",
  "",
].join("\n");

export function serializeVaultConfig(cfg: VaultConfig): string {
  const body = JSON.stringify({ legends: cfg.legends ?? {}, tabConfigs: cfg.tabConfigs ?? {} }, null, 2);
  return `${HEADER}\`\`\`json\n${body}\n\`\`\`\n`;
}

/** Liest den JSON-Block; null bei fehlendem/ungültigem Block (Datei dann ignorieren). */
export function parseVaultConfig(content: string): VaultConfig | null {
  const m = content.match(/```json\s*\n([\s\S]*?)\n\s*```/);
  if (!m) return null;
  try {
    const raw = JSON.parse(m[1]) as Partial<VaultConfig> | null;
    if (!raw || typeof raw !== "object") return null;
    return {
      legends: isRecord(raw.legends) ? raw.legends : {},
      tabConfigs: isRecord(raw.tabConfigs) ? raw.tabConfigs : {},
    };
  } catch {
    return null;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Inhaltlicher Vergleich (Reihenfolge der Keys egal bei gleicher Erzeugung). */
export function sameVaultConfig(a: VaultConfig, b: VaultConfig): boolean {
  return JSON.stringify(a.legends) === JSON.stringify(b.legends) &&
    JSON.stringify(a.tabConfigs) === JSON.stringify(b.tabConfigs);
}
