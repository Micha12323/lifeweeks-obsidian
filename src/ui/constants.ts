import type { LegendState } from "../core/types";
import { t } from "../i18n";

/** Standard-Legendenlabels in der UI-Sprache. */
export function legendDefaults(): Record<string, string> {
  return {
    past: t("legendPast"),
    current: t("legendCurrent"),
    future: t("legendFuture"),
    entry: t("legendEntry"),
  };
}

export const DEFAULT_LEGEND_COLORS = {
  past: "#d4cec8",
  current: "#f0c76a",
  future: "#ece7e0",
  entry: "#c97c3a",
};

export const PALETTE = [
  "#c97c3a",
  "#e05c5c",
  "#e08c3a",
  "#d4b800",
  "#4caf7a",
  "#3a9ec9",
  "#7c5cc9",
  "#c95c9e",
  "#5cc9bb",
  "#8d6e63",
  "#607d8b",
  "#455a64",
];

/**
 * Feste Breite neben den 52 Zellen in einer Grid-Zeile.
 * Die Zeile ist ein Flexbox mit `gap: 2px` zwischen ALLEN Kindern:
 * axis-l + 52 Zellen + 12 h-gaps + axis-r = 66 Kinder → 65 Flex-Gaps.
 * 65 Gaps à 2px + 12 h-gaps à 5px + Achsen 40/50px.
 */
export const FIXED_WIDTH = 65 * 2 + 12 * 5 + 40 + 50;

export const FIXED_LEGEND_KEYS = ["past", "current", "future", "entry"] as const;

export function defaultLegendState(): LegendState {
  return {
    labels: legendDefaults(),
    colors: { ...DEFAULT_LEGEND_COLORS },
    hidden: [],
    order: [...FIXED_LEGEND_KEYS],
    extras: [],
  };
}

/** Stellt sicher, dass order alle Extras enthält (Port von activeLegend aus der App). */
export function normalizeLegend(l?: LegendState): LegendState {
  if (!l) return defaultLegendState();
  const extraIds = (l.extras ?? []).map((e) => String(e.id));
  const base = l.order ?? [...FIXED_LEGEND_KEYS];
  const order = [...base, ...extraIds.filter((id) => !base.includes(id))];
  return { ...defaultLegendState(), ...l, order };
}
