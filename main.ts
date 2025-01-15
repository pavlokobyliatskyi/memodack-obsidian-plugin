import { Cache } from "cache";
import { icon } from "icon";
import { getPlatform } from "platform";
import { Player } from "player";
import { Translation } from "translation";
import { Tts } from "tts";
import { addIcon, Editor, Hotkey, Plugin } from "obsidian";
import { hotkeys } from "hot-keys";
import { MemodackPracticeModal } from "practice-modal";
import {
  IMemodackSettings,
  DEFAULT_MEMODACK_SETTINGS,
  MemodackSettingTab,
} from "setting-tab";

const translation = new Translation();

export default class MemodackPlugin extends Plugin {
  settings: IMemodackSettings;

  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_MEMODACK_SETTINGS,
      await this.loadData()
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async onload() {
    await this.loadSettings();

    addIcon(icon.id, icon.svg);

    // Working when switch to the Reading (Ctrl + E)
    this.registerMarkdownPostProcessor((element) => {
      // Process all paragraphs
      element.querySelectorAll("p").forEach((paragraph) => {
        const regex = /\(([^|]+)\|[^\\)]+\)/g; // Matches (word|translation)
        const originalHTML = paragraph.innerHTML;

        // Replace matches in the paragraph content
        const modifiedHTML = originalHTML.replace(regex, (_, word) => {
          return `<span class="syntax">${word}</span>`;
        });

        // Update paragraph content if modified
        if (modifiedHTML !== originalHTML) {
          paragraph.innerHTML = modifiedHTML;
        }
      });
    });

    const platform = getPlatform();

    this.addSettingTab(new MemodackSettingTab(this.app, this));

    this.addCommand({
      id: "translate",
      name: "Translate",
      hotkeys: hotkeys[platform] as Hotkey[],
      editorCallback: async (editor: Editor) => {
        const selection = editor.getSelection();

        // Translate
        const translate = await translation.translate(
          this.settings.source,
          this.settings.target,
          selection
        );

        if (!translate) {
          return;
        }

        editor.replaceSelection(`(${selection}|${translate})`);

        // TTS (don't wait)
        this.play(this.settings.source, selection).then(() => {
          this.play(this.settings.target, translate);
        });
      },
    });

    // Add the icon in the left ribbon.
    this.addRibbonIcon(icon.id, icon.title, () => {
      new MemodackPracticeModal(this.app, this.settings, this.manifest).open();
    });
  }

  onunload() {
    //
  }

  private async play(source: string, text: string) {
    const cache = new Cache(this.app.vault, this.manifest);
    const tts = new Tts();
    const player = new Player(tts, cache);

    await player.play(source, text);
  }
}
