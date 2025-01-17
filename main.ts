import { Cache } from "cache";
import { icon } from "icon";
import { Player } from "player";
import { Translation } from "translation";
import { Tts } from "tts";
import { addIcon, Editor, MarkdownView, Notice, Plugin } from "obsidian";
import { MemodackPracticeModal } from "practice-modal";
import {
  IMemodackSettings,
  DEFAULT_MEMODACK_SETTINGS,
  MemodackSettingTab,
} from "setting-tab";
import { regexCurly } from "regex";

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

    // Syntax (Reading)
    this.registerMarkdownPostProcessor((element) => {
      // Process all paragraphs within the element
      element.querySelectorAll("p").forEach((paragraph) => {
        const textContent = paragraph.textContent;

        // Check that textContent is not null
        if (textContent) {
          const lines = textContent.split("\n"); // Split textContent into lines
          const fragment = document.createDocumentFragment(); // Create a document fragment to hold new elements

          lines.forEach((line, lineIndex) => {
            let lastIndex = 0; // Initialize the last index for tracking text positions

            line.replace(
              regexCurly,
              (match, word: string, translation: string, offset: number) => {
                // Add text before the match
                if (offset > lastIndex) {
                  const text = line.slice(lastIndex, offset); // Get the text before the match
                  const span = createEl("span", { text });
                  fragment.appendChild(span);
                }

                const syntaxSpan = createEl("span", {
                  text: word,
                  cls: "syntax",
                  // Add translation to the word
                  attr: {
                    "data-translation": translation,
                  },
                });

                fragment.appendChild(syntaxSpan);

                // Update the last processed character index
                lastIndex = offset + match.length;

                // Return an empty string for compatibility with `replace`
                return "";
              }
            );

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
      hotkeys: [], // Alt+T
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

        editor.replaceSelection(`{${selection}|${translate}}`);

        // TTS (don't wait)
        this.play(this.settings.source, selection).then(() => {
          this.play(this.settings.target, translate);
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

        // TODO: Check if the <span> element is fully selected (For not Reading Mode)?
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

    const matches = [...content.matchAll(regexCurly)];

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
    const tts = new Tts();
    const player = new Player(tts, cache);

    await player.play(source, text);
  }
}
