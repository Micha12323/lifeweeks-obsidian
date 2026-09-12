import type { LegendState } from "../core/types";
import { t } from "../i18n";
import { legendDefaults, PALETTE } from "./constants";

/** Eine Palettenfarbe; label nur bei Legendenfarben (Tooltip). */
export interface PaletteColor {
  color: string;
  label?: string;
}

/**
 * Farben für Quick-Edit / Tagesansicht / Bulk-Edit: zuerst die Legenden-
 * einträge des aktiven Tabs (in Legendenreihenfolge, mit Namen), danach die
 * Standardpalette ohne Dubletten. Feste Zustandsfarben (vergangen, diese
 * Woche, Zukunft) sind keine Wochenfarben und bleiben draußen; "Mit Eintrag"
 * ist die Standardfarbe für Einträge und kommt mit.
 */
export function paletteColors(legend: LegendState | null | undefined): PaletteColor[] {
  const out: PaletteColor[] = [];
  const seen = new Set<string>();
  const push = (color: string, label?: string) => {
    const c = color.toLowerCase();
    if (!c || seen.has(c)) return;
    seen.add(c);
    out.push({ color, label });
  };
  if (legend) {
    const extras = Object.fromEntries(legend.extras.map((e) => [String(e.id), e]));
    for (const id of legend.order) {
      if (id === "entry" && !legend.hidden.includes("entry")) {
        push(legend.colors.entry, legend.labels.entry ?? legendDefaults().entry);
      } else if (extras[id]) {
        push(extras[id].color, extras[id].label);
      }
    }
  }
  for (const c of PALETTE) push(c);
  return out;
}

export function Palette({
  legend,
  value,
  onPick,
}: {
  legend?: LegendState | null;
  value: string | null | undefined;
  onPick: (color: string | null) => void;
}) {
  const colors = paletteColors(legend);
  const legendCount = colors.filter((c) => c.label).length;
  return (
    <div className="lw-qe-palette">
      <div
        className={`lw-swatch lw-swatch-none ${!value ? "active" : ""}`}
        title={t("noColor")}
        onClick={() => onPick(null)}
      />
      {colors.map((c, i) => (
        <div
          key={c.color}
          className={`lw-swatch ${c.label ? "lw-swatch-legend" : ""} ${value === c.color ? "active" : ""} ${
            i === legendCount && legendCount > 0 ? "lw-swatch-sep" : ""
          }`}
          style={{ background: c.color }}
          title={c.label}
          onClick={() => onPick(c.color)}
        />
      ))}
      <input
        type="color"
        className="lw-swatch-custom"
        value={value ?? "#c97c3a"}
        onChange={(e) => onPick(e.target.value)}
        title={t("customColor")}
      />
    </div>
  );
}
