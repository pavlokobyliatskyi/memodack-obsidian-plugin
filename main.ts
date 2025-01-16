import { Cache } from "cache";
import { icon } from "icon";
import { Player } from "player";
import { Translation } from "translation";
import { Tts } from "tts";
import { addIcon, Editor, Plugin } from "obsidian";
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

    this.registerMarkdownPostProcessor((element) => {
      // Process all paragraphs within the element
      element.querySelectorAll("p").forEach((paragraph) => {
        const regex = /\(([^|]+)\|[^\\)]+\)/g; // Matches (word|translation)
        const textContent = paragraph.textContent;

        // Check that textContent is not null
        if (textContent) {
          const lines = textContent.split("\n"); // Split textContent into lines
          const fragment = document.createDocumentFragment(); // Create a document fragment to hold new elements

          lines.forEach((line, lineIndex) => {
            let lastIndex = 0; // Initialize the last index for tracking text positions

            line.replace(regex, (match, word: string, offset: number) => {
              // Add text before the match
              if (offset > lastIndex) {
                const text = line.slice(lastIndex, offset); // Get the text before the match
                const span = createEl("span", { text });
                fragment.appendChild(span);
              }

              const syntaxSpan = createEl("span", {
                text: word,
                cls: "syntax",
              });
              fragment.appendChild(syntaxSpan);

              // Update the last processed character index
              lastIndex = offset + match.length;

              // Return an empty string for compatibility with `replace`
              return "";
            });

            // Add any remaining text after the last match
            if (lastIndex < line.length) {
              const text = line.slice(lastIndex); // Get the remaining text
              const remainingSpan = createEl("span", { text });
              fragment.appendChild(remainingSpan);
            }

            // Add a line break if it's not the last line
            if (lineIndex < lines.length - 1) {
              const br = createEl("br");
              fragment.appendChild(br);
            }
          });

          // Replace the paragraph's content with the new fragment
          paragraph.textContent = ""; // Clear the old content
          paragraph.appendChild(fragment);
        }
      });
    });

    this.addSettingTab(new MemodackSettingTab(this.app, this));

    this.addCommand({
      id: "translate",
      name: "Translate",
      hotkeys: [{ modifiers: ["Alt"], key: "T" }],
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
