import { languages } from "languages";
import MemodackPlugin from "main";
import { PluginSettingTab, App, Setting, Notice } from "obsidian";
import { Ping } from "ping";
import { TPlayOnClick, TServer } from "types";
import prettyBytes from "pretty-bytes";

export interface ISettings {
  source: string;
  target: string;
  server: TServer;
  url?: string;
  xApiKey?: string;
  playOnClick: TPlayOnClick;
  voiceoverSpeed: string;
}

export const DEFAULT_SETTINGS: Partial<ISettings> = {
  source: "en",
  target: "uk",
  server: "free",
  playOnClick: "translation",
  voiceoverSpeed: "1",
};

export class MemodackSettingTab extends PluginSettingTab {
  plugin: MemodackPlugin;

  constructor(app: App, plugin: MemodackPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async display(): Promise<void> {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", { text: "Server" });

    new Setting(containerEl)
      .setName("Type")
      .setDesc("Choose the server type")
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

    // Personal
    if (this.plugin.settings.server === "personal") {
      new Setting(containerEl)
        .setName("URL")
        .setDesc("This is the URL of the server API")
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
        .setName("X API Key")
        .setDesc("This credential grants access to the server")
        .addText((text) =>
          text
            .setPlaceholder("x-api-key found in the server file")
            .setValue(this.plugin.settings?.xApiKey || "")
            .onChange(async (value) => {
              value = value.replace(/\/$/, ""); // remove a trailing slash ("/");
              this.plugin.settings.xApiKey = value;
              await this.plugin.saveSettings();
            })
            .inputEl.setAttribute("type", "password")
        );

      new Setting(containerEl)
        .setName("Connection")
        .setDesc("Verify the connection to the server")
        .addButton((btn) =>
          btn
            .setButtonText("Check")
            .setCta()
            .onClick(() => {
              this.checkConnection();
            })
        );
    }

    containerEl.createEl("h2", { text: "Language" });

    new Setting(containerEl)
      .setName("Native")
      .setDesc("This is the language you speak natively")
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
      .setName("Document")
      .setDesc("This is the language of the document")
      .addDropdown((dropdown) => {
        dropdown
          .addOptions(languages)
          .setValue(this.plugin.settings.source)
          .onChange(async (value) => {
            this.plugin.settings.source = value;
            await this.plugin.saveSettings();
          });
      });

    // Options
    containerEl.createEl("h2", { text: "Options" });

    new Setting(containerEl)
      .setName("Voiceover Speed")
      .setDesc("At what speed do you want to voice over?")
      .addDropdown((dropdown) => {
        dropdown
          .addOptions({
            "1": "Normal",
            "2": "Faster",
            "3": "Super Fast",
          })
          .setValue(this.plugin.settings.voiceoverSpeed)
          .onChange(async (value) => {
            this.plugin.settings.voiceoverSpeed = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Play On Click")
      .setDesc("What action should be taken when clicking on a word or phrase?")
      .addDropdown((dropdown) => {
        dropdown
          .addOptions({
            disable: "Disable",
            value: "Value",
            translation: "Translation",
            "value-and-translation": "Value+Translation",
            "translation-and-value": "Translation+Value",
          })
          .setValue(this.plugin.settings.playOnClick)
          .onChange(async (value: TPlayOnClick) => {
            this.plugin.settings.playOnClick = value;
            await this.plugin.saveSettings();
          });
      });

    containerEl.createEl("h2", { text: "Optimization" });

    const cacheSize = await this.plugin.getCacheSize();

    // Cache
    const cacheSetting = new Setting(containerEl)
      .setName("Cache")
      .setDesc(prettyBytes(cacheSize))
      .addButton((btn) =>
        btn
          .setButtonText("Clear")
          .setCta()
          .onClick(() => {
            this.plugin.clearCache();
            cacheSetting.setDesc(prettyBytes(0));
          })
      );
  }

  // Temp
  private async checkConnection() {
    if (
      this.plugin.settings.server === "personal" &&
      this.plugin.settings?.url &&
      this.plugin.settings?.xApiKey
    ) {
      const ping = await Ping.ping(
        this.plugin.settings?.url,
        this.plugin.settings?.xApiKey
      );

      if (ping) {
        new Notice("Success Connection!");
      } else {
        new Notice("Failed Connection!");
      }
    }
  }
}
