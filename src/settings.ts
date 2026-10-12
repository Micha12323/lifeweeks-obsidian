import { App, PluginSettingTab, Setting } from "obsidian";
import type { SettingDefinitionItem } from "obsidian";
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

  /**
   * Obsidian 1.13+: deklarative Einstellungen (erscheinen in der Einstellungs-Suche).
   * Ältere Versionen rufen diese Methode nicht auf und nutzen display().
   */
  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: t("settingBasePath"),
        desc: t("settingBasePathDesc"),
        control: { type: "folder", key: "basePath", placeholder: "Bibliothek/Diary" },
      },
      {
        name: t("settingBirthDate"),
        desc: t("settingBirthDateDesc"),
        control: {
          type: "text",
          key: "birthDate",
          placeholder: "1991-11-10",
          validate: (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v.trim()) ? undefined : t("settingBirthDateDesc")),
        },
      },
      {
        name: t("settingLifeExp"),
        desc: t("settingLifeExpDesc"),
        control: { type: "number", key: "lifeExpectancy", min: 1, max: 130, step: 1, defaultValue: 90 },
      },
      {
        name: t("settingName"),
        desc: t("settingNameDesc"),
        control: { type: "text", key: "userName" },
      },
      {
        name: t("settingOpenMode"),
        desc: t("settingOpenModeDesc"),
        control: {
          type: "dropdown",
          key: "openMode",
          options: { auto: t("openModeAuto"), split: t("openModeSplit"), tab: t("openModeTab") },
        },
      },
    ];
  }

  /** Gleiche Normalisierung wie in display(); basePath-Wechsel liest die Sync-Datei neu ein. */
  async setControlValue(key: string, value: unknown): Promise<void> {
    const s = this.plugin.settings;
    switch (key) {
      case "basePath":
        s.basePath = String(value ?? "").replace(/^\/+|\/+$/g, "");
        await this.plugin.saveSettings();
        await this.plugin.loadVaultConfig({ migrate: false });
        return;
      case "birthDate":
        s.birthDate = String(value ?? "").trim();
        break;
      case "lifeExpectancy": {
        const n = typeof value === "number" ? value : parseInt(String(value), 10);
        if (isNaN(n) || n <= 0 || n > 130) return;
        s.lifeExpectancy = n;
        break;
      }
      case "userName":
        s.userName = String(value ?? "");
        break;
      case "openMode":
        s.openMode = value as OpenMode;
        break;
      default:
        return;
    }
    await this.plugin.saveSettings();
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
            // Sync-Datei liegt im Basisordner → bei Pfadwechsel neu einlesen
            await this.plugin.loadVaultConfig({ migrate: false });
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
