import { Plugin, WorkspaceLeaf } from "obsidian";
import { LifeWeeksView, VIEW_TYPE_LIFEWEEKS } from "./view";
import { DEFAULT_SETTINGS, LifeWeeksSettings, LifeWeeksSettingTab } from "./settings";

export default class LifeWeeksPlugin extends Plugin {
  settings: LifeWeeksSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    this.registerView(VIEW_TYPE_LIFEWEEKS, (leaf: WorkspaceLeaf) => new LifeWeeksView(leaf, this));

    this.addRibbonIcon("calendar-days", "Life in Weeks öffnen", () => {
      void this.activateView();
    });

    this.addCommand({
      id: "open",
      name: "Öffnen",
      callback: () => void this.activateView(),
    });

    this.addSettingTab(new LifeWeeksSettingTab(this.app, this));
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

  async loadSettings() {
    const data = (await this.loadData()) as Partial<LifeWeeksSettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
