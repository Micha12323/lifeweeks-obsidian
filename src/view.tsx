import { ItemView, WorkspaceLeaf } from "obsidian";
import { StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";
import type LifeWeeksPlugin from "./main";
import { LifeWeeksApp } from "./ui/App";

export const VIEW_TYPE_LIFEWEEKS = "lifeweeks-view";

export class LifeWeeksView extends ItemView {
  plugin: LifeWeeksPlugin;
  private root: Root | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: LifeWeeksPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_LIFEWEEKS;
  }

  getDisplayText(): string {
    return "Life in Weeks";
  }

  getIcon(): string {
    return "calendar-days";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("lifeweeks-root");
    this.root = createRoot(container);
    this.root.render(
      <StrictMode>
        <LifeWeeksApp plugin={this.plugin} />
      </StrictMode>
    );
  }

  async onClose() {
    this.root?.unmount();
    this.root = null;
  }
}
