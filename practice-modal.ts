import { getRandomNumbers } from "numbers";
import { Modal, App, PluginManifest } from "obsidian";
import { Player } from "player";
import { ISettings } from "setting-tab";
import { shuffle } from "shuffle";
import { Tts } from "tts";
import { Cache } from "cache";

export class MemodackPracticeModal extends Modal {
  settings: ISettings;
  private blitzMap: Map<
    number,
    {
      correctId: number;
      question: string;
      answers: string[];
    }
  > = new Map();
  manifest: PluginManifest;

  words: { word: string; translation: string }[] = [];

  constructor(
    app: App,
    settings: ISettings,
    manifest: PluginManifest,
    words: { word: string; translation: string }[]
  ) {
    super(app);
    this.settings = settings;
    this.manifest = manifest;

    this.words = words;
  }

  async onOpen() {
    const shuffleWords = shuffle(this.words);

    shuffleWords.forEach((word, index) => {
      // Get 3 words except 1 (answers)
      const [n1, n2, n3] = getRandomNumbers(shuffleWords.length, index, 3);

      // Get correct answer translation (correctId)
      const answers = [
        word.translation,
        shuffleWords[n1].translation,
        shuffleWords[n2].translation,
        shuffleWords[n3].translation,
      ];

      const shuffleAnswers = shuffle(answers);

      const correctId = shuffleAnswers.findIndex(
        (item) => item === word.translation
      );

      this.blitzMap.set(index, {
        question: word.word,
        correctId,
        answers,
      });
    });

    await this.nextBlitz(0);
  }

  private async nextBlitz(id: number) {
    const blitz = this.blitzMap.get(id);

    if (!blitz) {
      this.close();
      return;
    }

    const { contentEl } = this;
    contentEl.empty();

    const wordEl = contentEl.createEl("h2");
    wordEl.setText(blitz.question);
    wordEl.addClass("blitz__question");

    // TTS (don't wait)
    this.play(this.settings.source, blitz.question);

    const optionsEl = contentEl.createEl("div");
    optionsEl.addClass("blitz__answers");

    let nextButtonEl: HTMLButtonElement | undefined = undefined;
    let correctOptionEl: HTMLButtonElement | undefined = undefined;

    // TODO: Fix?
    const answersButtons: HTMLButtonElement[] = [];

    blitz.answers.forEach((option, index) => {
      const optionEl = optionsEl.createEl("button");

      if (blitz.correctId === index) {
        correctOptionEl = optionEl;
      }

      // Add for disabled
      answersButtons.push(optionEl);

      optionEl.setText(option);
      optionEl.addEventListener("click", () => {
        // Disable all answer buttons
        answersButtons.forEach((item) => {
          item.disabled = true;
        });

        if (blitz.correctId === index) {
          optionEl.addClass("correct");

          // TTS (don't wait)
          this.play(this.settings.target, option);
        } else {
          optionEl.addClass("wrong");
          correctOptionEl?.addClass("correct");

          // TODO: Fix? Push to the end for try again
          const blitzTranslation = blitz.answers[blitz.correctId];

          const shuffleAnswers = shuffle(blitz.answers);

          const correctId = shuffleAnswers.findIndex(
            (item) => item === blitzTranslation
          );

          this.blitzMap.set(this.blitzMap.size, {
            ...blitz,
            answers: shuffleAnswers,
            correctId,
          });
        }

        if (this.blitzMap.size === id) {
          this.close();
          return;
        }

        if (!nextButtonEl) {
          return;
        }

        nextButtonEl.disabled = false;
      });
    });

    const hrEl = contentEl.createEl("hr");
    hrEl.addClass("blitz__hr");

    const blitzNext = contentEl.createEl("div");
    blitzNext.addClass("blitz__next");

    nextButtonEl = blitzNext.createEl("button");
    nextButtonEl.setText("Next");
    nextButtonEl.disabled = true;

    nextButtonEl.addEventListener("click", () => {
      this.nextBlitz(id + 1);
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  private async play(source: string, text: string) {
    const cache = new Cache(this.app.vault, this.manifest);
    const tts = new Tts();
    const player = new Player(tts, cache);

    await player.play(source, text);
  }
}
