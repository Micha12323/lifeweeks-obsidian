export interface WeekLabel {
  /** "06.04.2026 – 12.04.2026" */
  dates: string;
  /** "Jahr 1, Woche 14" */
  life: string;
}

export interface WeekData {
  color: string | null;
  hasEntry: boolean;
  title: string;
  /** Vault-Pfad der Wochennotiz */
  path: string;
}

/** weekKey (lokales ISO-Datum des Wochenbeginns) → Daten */
export type TabWeeks = Record<string, WeekData>;

export interface TabInfo {
  /** Tab-Name = Ordnername unter "Weekly basis/" */
  name: string;
  /** Vault-Pfad des Tab-Ordners */
  folderPath: string;
}

export interface LegendExtra {
  id: string;
  color: string;
  label: string;
}

/** Legende pro Tab (Struktur wie in der Browser-App, allLegends) */
export interface LegendState {
  labels: Record<string, string>;
  colors: Record<string, string>;
  hidden: string[];
  order: string[];
  extras: LegendExtra[];
}

/** Tab-Einstellungen (eigene Zeitachse etc.), keyed über den Tab-Namen */
export interface TabConfig {
  birthDate?: string | null;
  lifeExpectancy?: number | null;
  showMilestones?: boolean;
  ownDailyBasis?: boolean;
}
