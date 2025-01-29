import { App, Notice, PluginSettingTab, Setting } from "obsidian";

import MemodackPlugin from "./main";
import { TPlayOnClick } from "./types";
import { TTS } from "./tts";
import { Translation } from "./translation";
import { languages } from "./languages";
import prettyBytes from "pretty-bytes";

export interface ISettings {
  source: string;
  target: string;
  playOnClick: TPlayOnClick;
  voiceoverSpeed: string;
  apiKey: string;
}

export const DEFAULT_SETTINGS: Partial<ISettings> = {
  source: "en",
  target: "uk",
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

    new Setting(containerEl).setName("Provider (Google)").setHeading();

    new Setting(containerEl)
      .setName("API Key")
      .setDesc("API key for translation and text-to-speech services.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings?.apiKey || "")
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          })
          .inputEl.setAttribute("type", "password")
      );

    new Setting(containerEl)
      .setName("Connection")
      .setDesc("Check access to services by API key.")
      .addButton((btn) =>
        btn
          .setButtonText("Check")
          .setCta()
          .onClick(() => {
            this.check();
          })
      );

    new Setting(containerEl).setName("Language").setHeading();

    new Setting(containerEl)
      .setName("Native")
      .setDesc("This is the language you speak natively.")
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
      .setDesc("This is the language of the document.")
      .addDropdown((dropdown) => {
        dropdown
          .addOptions(languages)
          .setValue(this.plugin.settings.source)
          .onChange(async (value) => {
            this.plugin.settings.source = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl).setName("Voiceover").setHeading();

    new Setting(containerEl)
      .setName("Playback speed")
      .setDesc("The speed at which the voiceover will be performed.")
      .addDropdown((dropdown) => {
        dropdown
          // It's the same approach as YouTube.
          .addOptions({
            "1": "Normal",
            "2": "x2",
            "3": "x3",
          })
          .setValue(this.plugin.settings.voiceoverSpeed)
          .onChange(async (value) => {
            this.plugin.settings.voiceoverSpeed = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl).setName("Actions").setHeading();

    new Setting(containerEl)
      .setName("When pressed play")
      .setDesc("Will be voiced when you click on a word or phrase.")
      .addDropdown((dropdown) => {
        dropdown
          .addOptions({
            nothing: "Nothing",
            value: "Value",
            translation: "Translation",
            "value-and-translation": "Value + Translation",
            "translation-and-value": "Translation + Value",
          })
          .setValue(this.plugin.settings.playOnClick)
          .onChange(async (value: TPlayOnClick) => {
            this.plugin.settings.playOnClick = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl).setName("Optimization").setHeading();

    const cacheSize = await this.plugin.getCacheSize();

    const cacheSetting = new Setting(containerEl)
      .setName("Cache")
      .setDesc(`${prettyBytes(cacheSize)}.`)
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

  private async check() {
    const apiKey = this.plugin.settings?.apiKey;

    if (!apiKey) {
      new Notice("Fill in the field to enter the API key.");
      return;
    }

    this.checkTranslation(apiKey);
    this.checkTTS(apiKey);
  }

  private async checkTranslation(apiKey: string) {
    try {
      // Translation
      const translation = new Translation(apiKey);
      const translatatedText = await translation.translate("en", "uk", "ping");

      if (translatatedText !== "пінг") {
        new Notice("The translation service is not working.");
        return;
      }

      new Notice("The translation service is working.");
    } catch (e) {
      new Notice("The translation service is not working.");
    }
  }

  private async checkTTS(apiKey: string) {
    try {
      // TTS
      const tts = new TTS(apiKey);
      const base64 = await tts.tts("en", "ping");

      if (!base64) {
        new Notice("The text-to-speech service is not working.");
        return;
      }

      new Notice("The text-to-speech service is working.");
    } catch (e) {
      new Notice("The text-to-speech service is not working.");
    }
  }
}
