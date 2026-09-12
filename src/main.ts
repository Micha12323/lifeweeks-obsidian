import { Notice, Plugin, TAbstractFile, TFolder, WorkspaceLeaf, debounce } from "obsidian";
import { LifeWeeksView, VIEW_TYPE_LIFEWEEKS } from "./view";
import { DEFAULT_SETTINGS, LifeWeeksSettings, LifeWeeksSettingTab } from "./settings";
import { t } from "./i18n";
import {
  parseVaultConfig,
  sameVaultConfig,
  serializeVaultConfig,
  vaultConfigPath,
  VaultConfig,
} from "./core/vaultConfig";
import { getFile, getFolder, weeklyBasisPath } from "./data/WeekIndex";
import { dailyBasisPath } from "./data/DailyIndex";

/** Ereignis für die UI: Einstellungen von außen geändert oder Tab umbenannt */
export type SettingsChangeEvent = { type: "sync" } | { type: "tabRenamed"; from: string; to: string };

/** Aktionen der gemounteten Ansicht, von der App registriert (für Befehle). */
export interface ViewActions {
  openToday: () => void;
  jumpToCurrentWeek: () => void;
}

export default class LifeWeeksPlugin extends Plugin {
  settings: LifeWeeksSettings = DEFAULT_SETTINGS;
  viewActions: ViewActions | null = null;

  /** Zuletzt in die Vault-Datei geschriebener Inhalt – eigene modify-Events erkennen */
  private lastWrittenConfig: string | null = null;
  private changeListeners = new Set<(ev: SettingsChangeEvent) => void>();

  async onload() {
    await this.loadSettings();

    this.registerView(VIEW_TYPE_LIFEWEEKS, (leaf: WorkspaceLeaf) => new LifeWeeksView(leaf, this));

    this.addRibbonIcon("calendar-days", t("ribbonOpen"), () => {
      void this.activateView();
    });

    this.addCommand({
      id: "open",
      name: t("cmdOpen"),
      callback: () => void this.activateView(),
    });

    this.addCommand({
      id: "open-today",
      name: t("cmdOpenToday"),
      callback: () => void this.withView((a) => a.openToday()),
    });

    this.addCommand({
      id: "jump-current-week",
      name: t("cmdJumpCurrent"),
      callback: () => void this.withView((a) => a.jumpToCurrentWeek()),
    });

    this.addSettingTab(new LifeWeeksSettingTab(this.app, this));

    // Geräteübergreifende Einstellungen (Legenden, Tab-Zeitachsen) liegen als
    // Markdown-Datei im Vault – erst lesen, wenn der Vault vollständig geladen ist.
    this.app.workspace.onLayoutReady(() => void this.loadVaultConfig({ migrate: true }));

    // Änderungen von außen (Sync von einem anderen Gerät) übernehmen
    const onFileChange = (file: TAbstractFile) => {
      if (file.path !== vaultConfigPath(this.settings.basePath)) return;
      void this.loadVaultConfig({ migrate: false });
    };
    this.registerEvent(this.app.vault.on("modify", onFileChange));
    this.registerEvent(this.app.vault.on("create", onFileChange));

    // Tab-Ordner umbenannt → Legende/Zeitachse (und eigenen Tagesordner) mitziehen
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => void this.handleTabRename(file, oldPath))
    );
  }

  /**
   * Legende und Tab-Konfiguration hängen am Tab-Namen (= Ordnername unter
   * "Weekly basis/"). Ohne diesen Hook stünde ein umbenannter Tab ohne Legende
   * da und der alte Eintrag bliebe verwaist in der Sync-Datei.
   */
  private async handleTabRename(file: TAbstractFile, oldPath: string): Promise<void> {
    if (!(file instanceof TFolder)) return;
    const weekly = weeklyBasisPath(this.settings.basePath);
    const oldParent = oldPath.slice(0, oldPath.lastIndexOf("/"));
    if (oldParent !== weekly || file.parent?.path !== weekly) return;
    const from = oldPath.slice(weekly.length + 1);
    const to = file.name;
    if (from === to) return;

    const { legends, tabConfigs } = this.settings;
    const hadLegend = from in legends;
    const hadConfig = from in tabConfigs;
    if (!hadLegend && !hadConfig) return;
    // Zielname schon belegt (z.B. Legende eines früher gelöschten Tabs) → nicht überschreiben
    if (hadLegend && !(to in legends)) {
      legends[to] = legends[from];
      delete legends[from];
    }
    if (hadConfig && !(to in tabConfigs)) {
      tabConfigs[to] = tabConfigs[from];
      delete tabConfigs[from];
    }

    // Eigener Tagesordner "Daily basis/{Tab}/" folgt dem Tab-Namen
    let dailyMoved = false;
    if (tabConfigs[to]?.ownDailyBasis) {
      const oldDaily = getFolder(this.app, dailyBasisPath(this.settings.basePath, from));
      const newDailyPath = dailyBasisPath(this.settings.basePath, to);
      if (oldDaily && !this.app.vault.getAbstractFileByPath(newDailyPath)) {
        try {
          await this.app.fileManager.renameFile(oldDaily, newDailyPath);
          dailyMoved = true;
        } catch (e) {
          console.warn("[lifeweeks] Tagesordner konnte nicht umbenannt werden", e);
        }
      }
    }

    await this.saveSyncedSettings();
    this.changeListeners.forEach((cb) => cb({ type: "tabRenamed", from, to }));
    new Notice(t(dailyMoved ? "tabRenamedDaily" : "tabRenamed", { from, to }));
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_LIFEWEEKS)[0];
    if (!leaf) {
      leaf = workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE_LIFEWEEKS, active: true });
    }
    void workspace.revealLeaf(leaf);
  }

  /** Ansicht öffnen (falls nötig) und eine ihrer Aktionen ausführen, sobald React gemountet ist. */
  private async withView(fn: (a: ViewActions) => void): Promise<void> {
    await this.activateView();
    for (let i = 0; i < 20 && !this.viewActions; i++) {
      await new Promise((r) => setTimeout(r, 50));
    }
    if (this.viewActions) fn(this.viewActions);
  }

  async loadSettings() {
    const data = (await this.loadData()) as Partial<LifeWeeksSettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
  }

  /** Nur lokal (data.json): Geburtsdatum, Basisordner, Öffnen-Modus … */
  async saveSettings() {
    await this.saveData(this.settings);
  }

  /** Lokal + Sync-Datei im Vault: Legenden und Tab-Konfiguration (geräteübergreifend). */
  async saveSyncedSettings() {
    await this.saveData(this.settings);
    this.scheduleVaultWrite();
  }

  // ── Sync-Datei im Vault ───────────────────────────────────────────
  private currentVaultConfig(): VaultConfig {
    return { legends: this.settings.legends, tabConfigs: this.settings.tabConfigs };
  }

  /**
   * Vault-Datei lesen und übernehmen. Die Vault-Datei gewinnt gegenüber data.json
   * (sie ist der synchronisierte Stand). Gibt es sie noch nicht, wird sie bei
   * migrate=true aus den lokalen Settings angelegt – aber nur, wenn der
   * Basisordner samt "Weekly basis/" existiert (keine Streu-Dateien beim Tippen
   * eines neuen Basispfads).
   */
  async loadVaultConfig(opts: { migrate: boolean }): Promise<void> {
    const path = vaultConfigPath(this.settings.basePath);
    const file = getFile(this.app, path);
    if (!file) {
      const hasData =
        Object.keys(this.settings.legends).length > 0 || Object.keys(this.settings.tabConfigs).length > 0;
      if (opts.migrate && hasData && getFolder(this.app, weeklyBasisPath(this.settings.basePath))) {
        await this.writeVaultConfig();
      }
      return;
    }
    let content: string;
    try {
      content = await this.app.vault.read(file);
    } catch (e) {
      console.warn("[lifeweeks] Vault-Config nicht lesbar", e);
      return;
    }
    if (content === this.lastWrittenConfig) return; // eigenes Schreiben
    const cfg = parseVaultConfig(content);
    if (!cfg) {
      console.warn("[lifeweeks] Vault-Config ohne gültigen JSON-Block – ignoriert:", path);
      return;
    }
    if (sameVaultConfig(cfg, this.currentVaultConfig())) return;
    this.settings.legends = cfg.legends;
    this.settings.tabConfigs = cfg.tabConfigs;
    this.lastWrittenConfig = content;
    await this.saveData(this.settings); // lokaler Cache
    this.changeListeners.forEach((cb) => cb({ type: "sync" }));
  }

  private scheduleVaultWrite = debounce(() => void this.writeVaultConfig(), 500, true);

  private async writeVaultConfig(): Promise<void> {
    const content = serializeVaultConfig(this.currentVaultConfig());
    if (content === this.lastWrittenConfig) return;
    // Nie Ordner anlegen: Legenden/Tabs setzen voraus, dass der Basisordner existiert
    if (!getFolder(this.app, this.settings.basePath)) return;
    const path = vaultConfigPath(this.settings.basePath);
    try {
      const file = getFile(this.app, path);
      this.lastWrittenConfig = content;
      if (file) await this.app.vault.modify(file, content);
      else await this.app.vault.create(path, content);
    } catch (e) {
      this.lastWrittenConfig = null;
      console.warn("[lifeweeks] Vault-Config konnte nicht geschrieben werden", e);
    }
  }

  /** UI-Benachrichtigung bei extern (per Sync) geänderten Einstellungen. */
  onSettingsChanged(cb: (ev: SettingsChangeEvent) => void): () => void {
    this.changeListeners.add(cb);
    return () => this.changeListeners.delete(cb);
  }
}
