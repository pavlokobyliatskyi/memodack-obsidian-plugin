import { languages } from "languages";
import MemodackPlugin from "main";
import { PluginSettingTab, App, Setting } from "obsidian";
import { TServer } from "types";

export interface ISettings {
  source: string;
  target: string;
  server: TServer;
  url?: string;
  xApiKey?: string;
}

export const DEFAULT_SETTINGS: Partial<ISettings> = {
  source: "en",
  target: "uk",
  server: "free",
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
      .setName("Server")
      .setDesc("Get translation or audio url ")
      .addDropdown((dropdown) => {
        dropdown
          .addOptions({
            free: "Free",
            personal: "Personal",
          })
          .setValue(this.plugin.settings.server)
          .onChange(async (value: TServer) => {
            this.plugin.settings.server = value;
            await this.plugin.saveSettings();

            // Temp
            this.display();
          });
      });

    if (this.plugin.settings.server === "personal") {
      new Setting(containerEl)
        .setName("Server URL")
        .setDesc("This is a server URL")
        .addText((text) =>
          text
            .setPlaceholder(
              "https://u6r709mlz0.execute-api.eu-central-1.amazonaws.com"
            )
            .setValue(this.plugin.settings?.url || "")
            .onChange(async (value) => {
              this.plugin.settings.url = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("Server X API Key")
        .setDesc("This is credential for access to server")
        .addText((text) =>
          text
            .setPlaceholder("from the lambda function")
            .setValue(this.plugin.settings?.xApiKey || "")
            .onChange(async (value) => {
              value = value.replace(/\/$/, ""); // remove a trailing slash ("/");
              this.plugin.settings.xApiKey = value;
              await this.plugin.saveSettings();
            })
            .inputEl.setAttribute("type", "password")
        );
    }

    new Setting(containerEl)
      .setName("Your Native Language")
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

    new Setting(containerEl)
      .setName("Document Text Language")
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
  }
}
