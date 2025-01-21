import { Cache } from "cache";
import { icon } from "icon";
import { Player } from "player";
import { addIcon, Editor, MarkdownView, Notice, Plugin } from "obsidian";
import { MemodackPracticeModal } from "practice-modal";
import { ISettings, DEFAULT_SETTINGS, MemodackSettingTab } from "setting-tab";
import { Free } from "free";
import { Personal } from "personal";
import { IServer } from "types";
import { Ping } from "ping";

export default class MemodackPlugin extends Plugin {
  settings: ISettings;

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async onload() {
    await this.loadSettings();

    await this.checkConnection();

    addIcon(icon.id, icon.svg);

    // Syntax (Reading)
    this.registerMarkdownPostProcessor((element) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);

      const nodesToReplace = [];
      let node;

      while ((node = walker.nextNode())) {
        if (node?.nodeValue && node.nodeValue.match(/\{.*?\|.*?\}/)) {
          nodesToReplace.push(node);
        }
      }

      if (!nodesToReplace.length) {
        return;
      }

      nodesToReplace.forEach((node) => {
        if (!node?.nodeValue) {
          return;
        }

        const fragment = document.createDocumentFragment();

        const parts = node.nodeValue.split(/(\{.*?\|.*?\})/);

        parts.forEach((part) => {
          const match = part.match(/\{(.*?)\|(.*?)\}/);

          if (match) {
            // TODO: Remove!?
            const cls = ["syntax"];

            if (this.settings.playOnClick !== "disable") {
              cls.push("hover");
            }

            const span = createEl("span", {
              cls,
              text: match[1],
              // Add translation
              attr: {
                "data-translation": match[2],
              },
            });

            // Temp
            if (match[1] && match[2]) {
              span.onClickEvent(() => this.playOnClick(match[1], match[2]));
            }

            fragment.appendChild(span);
          } else {
            fragment.appendChild(document.createTextNode(part));
          }
        });

        if (!node.parentNode) {
          return;
        }

        node.parentNode.replaceChild(fragment, node);
      });
    });

    this.addSettingTab(new MemodackSettingTab(this.app, this));

    this.addCommand({
      id: "translate",
      name: "Translate",
      hotkeys: [], // Alt+T
      editorCallback: async (editor: Editor) => {
        const selection = editor.getSelection();

        // Translate
        let translation: string | null = null;

        // Temp
        if (
          this.settings.server === "personal" &&
          this.settings?.url &&
          this.settings?.xApiKey
        ) {
          const personal = new Personal(
            this.settings.url,
            this.settings.xApiKey
          );

          translation = await personal.getTranslation(
            this.settings.source,
            this.settings.target,
            selection
          );
        } else {
          const free = new Free();

          translation = await free.getTranslation(
            this.settings.source,
            this.settings.target,
            selection
          );
        }

        if (!translation) {
          return;
        }

        editor.replaceSelection(`{${selection}|${translation}}`);

        // TTS (don't wait)
        this.play(this.settings.source, selection).then(() => {
          if (!translation) {
            return;
          }

          this.play(this.settings.target, translation);
        });
      },
    });

    // Add the icon in the left ribbon.
    this.addRibbonIcon(icon.id, icon.title, async () => {
      const isReadingMode =
        this.app.workspace.getActiveViewOfType(MarkdownView)?.getMode() ===
        "preview";

      // Temp
      const selection = this.app.workspace.activeEditor?.editor?.getSelection();

      if (!isReadingMode && selection) {
        new Notice("Only in Reding Mode!");
        return;
      }

      const words = await this.getWords();

      if (!words?.length) {
        new Notice("No words provided!");
        return;
      }

      if (words.length < 4) {
        new Notice("At least 4 words required!");
        return;
      }

      new MemodackPracticeModal(
        this.app,
        this.settings,
        this.manifest,
        words
      ).open();
    });
  }

  async getWords() {
    const activeFile = this.app.workspace.getActiveFile();

    if (!activeFile) {
      return;
    }

    const words: { word: string; translation: string }[] = [];

    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0 && selection.toString().length) {
      // Get words from selection only
      const ranges = selection.getRangeAt(0);
      const spans = document.querySelectorAll(".syntax");

      // Iterate over all <span> elements
      spans.forEach((span) => {
        const spanRange = document.createRange();
        spanRange.selectNode(span);

        // Check if the selection intersects with the <span> element
        if (ranges.intersectsNode(span)) {
          const word = span.textContent;
          const translation = span.getAttribute("data-translation");

          // Format the string and add it to the array
          if (word && translation) {
            words.push({ word, translation });
          }
        }
      });

      // Clear selection
      selection.removeAllRanges();

      return words;
    }

    // Get words from the all file
    const content = await this.app.vault.read(activeFile);

    if (!content.length) {
      return [];
    }

    const matches = [...content.matchAll(/\{([^\\|{}]+)\|([^\\|{}]+)\}/g)]; // {value|translation}

    // Generate words array
    matches.forEach((match) => {
      // Don't put duplicates to the array
      if (words.find((item) => item.word === match[1])) {
        return;
      }

      words.push({
        word: match[1],
        translation: match[2],
      });
    });

    return words;
  }

  onunload() {
    //
  }

  private async play(source: string, text: string) {
    const cache = new Cache(this.app.vault, this.manifest);

    // Temp
    let server: IServer;

    if (
      this.settings.server === "personal" &&
      this.settings?.url &&
      this.settings?.xApiKey
    ) {
      server = new Personal(this.settings.url, this.settings.xApiKey);
    } else {
      server = new Free();
    }

    const player = new Player(server, cache);

    await player.play(source, text);
  }

  // Temp
  async checkConnection() {
    if (
      this.settings.server === "personal" &&
      this.settings?.url &&
      this.settings?.xApiKey
    ) {
      const ping = await Ping.ping(this.settings?.url, this.settings?.xApiKey);

      // Switch to Free
      if (!ping) {
        this.settings.server = "free";
        await this.loadSettings();
      }
    }
  }

  // Temp
  async clearCache() {
    const cache = new Cache(this.app.vault, this.manifest);
    await cache.clearCache();
  }

  // Temp
  async getCacheSize() {
    const cache = new Cache(this.app.vault, this.manifest);
    return await cache.getCacheSize();
  }

  // Temp
  async playOnClick(value: string, translation: string) {
    if (this.settings.playOnClick === "disable") {
      return;
    }

    switch (this.settings.playOnClick) {
      case "value":
        this.play(this.settings.source, value);
        break;

      case "translation":
        this.play(this.settings.target, translation);
        break;

      case "value-and-translation":
        this.play(this.settings.source, value).then(() => {
          if (!translation) {
            return;
          }

          this.play(this.settings.target, translation);
        });
        break;

      case "translation-and-value":
        this.play(this.settings.target, translation).then(() => {
          if (!translation) {
            return;
          }

          this.play(this.settings.source, value);
        });
        break;

      default:
        break;
    }
  }
}
