import { languages } from "languages";
import MemodackPlugin from "main";
import { PluginSettingTab, App, Setting } from "obsidian";

export interface IMemodackSettings {
  source: string;
  target: string;
}

export const DEFAULT_MEMODACK_SETTINGS: Partial<IMemodackSettings> = {
  source: "en",
  target: "uk",
};

export class MemodackSettingTab extends PluginSettingTab {
  plugin: MemodackPlugin;

  constructor(app: App, plugin: MemodackPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Source")
      .setDesc("This is a second language")
      .addDropdown((dropdown) => {
        dropdown
          .addOptions(languages)
          .setValue(this.plugin.settings.source)
          .onChange(async (value) => {
            this.plugin.settings.source = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Target")
      .setDesc("This is your native language")
      .addDropdown((dropdown) => {
        dropdown
          .addOptions(languages)
          .setValue(this.plugin.settings.target)
          .onChange(async (value) => {
            this.plugin.settings.target = value;
            await this.plugin.saveSettings();
          });
      });
  }
}
