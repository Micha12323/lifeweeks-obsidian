import { App, PluginSettingTab, Setting } from "obsidian";
import type { LegendState, TabConfig } from "./core/types";
import { t } from "./i18n";
import type LifeWeeksPlugin from "./main";

export type OpenMode = "auto" | "split" | "tab";

export interface LifeWeeksSettings {
  /** Basisordner im Vault, darunter liegen "Weekly basis/" und "Daily basis/" */
  basePath: string;
  /** Geburtsdatum als lokales ISO-Datum (YYYY-MM-DD) */
  birthDate: string;
  /** Lebenserwartung in Jahren = Anzahl Grid-Zeilen */
  lifeExpectancy: number;
  userName: string;
  /** Wo Wochen-/Tagesnotizen geöffnet werden */
  openMode: OpenMode;
  /** Legende pro Tab-Name */
  legends: Record<string, LegendState>;
  /** Tab-Einstellungen (eigene Zeitachse etc.) pro Tab-Name */
  tabConfigs: Record<string, TabConfig>;
}

export const DEFAULT_SETTINGS: LifeWeeksSettings = {
  basePath: "Bibliothek/Diary",
  birthDate: "",
  lifeExpectancy: 90,
  userName: "",
  openMode: "auto",
  legends: {},
  tabConfigs: {},
};

export class LifeWeeksSettingTab extends PluginSettingTab {
  plugin: LifeWeeksPlugin;

  constructor(app: App, plugin: LifeWeeksPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName(t("settingBasePath"))
      .setDesc(t("settingBasePathDesc"))
      .addText((text) =>
        text
          .setPlaceholder("Bibliothek/Diary")
          .setValue(this.plugin.settings.basePath)
          .onChange(async (value) => {
            this.plugin.settings.basePath = value.replace(/^\/+|\/+$/g, "");
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("settingBirthDate"))
      .setDesc(t("settingBirthDateDesc"))
      .addText((text) =>
        text
          .setPlaceholder("1991-11-10")
          .setValue(this.plugin.settings.birthDate)
          .onChange(async (value) => {
            this.plugin.settings.birthDate = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("settingLifeExp"))
      .setDesc(t("settingLifeExpDesc"))
      .addText((text) =>
        text
          .setPlaceholder("90")
          .setValue(String(this.plugin.settings.lifeExpectancy))
          .onChange(async (value) => {
            const n = parseInt(value, 10);
            if (!isNaN(n) && n > 0 && n <= 130) {
              this.plugin.settings.lifeExpectancy = n;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName(t("settingName"))
      .setDesc(t("settingNameDesc"))
      .addText((text) =>
        text.setValue(this.plugin.settings.userName).onChange(async (value) => {
          this.plugin.settings.userName = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(t("settingOpenMode"))
      .setDesc(t("settingOpenModeDesc"))
      .addDropdown((dd) =>
        dd
          .addOption("auto", t("openModeAuto"))
          .addOption("split", t("openModeSplit"))
          .addOption("tab", t("openModeTab"))
          .setValue(this.plugin.settings.openMode)
          .onChange(async (value) => {
            this.plugin.settings.openMode = value as OpenMode;
            await this.plugin.saveSettings();
          })
      );
  }
}
