import { Hash } from "hash";
import { Cache } from "cache";
import { Tts } from "tts";

export class Player {
  private audio = new Audio();
  cache: Cache;
  tts: Tts;

  constructor(tts: Tts, cache: Cache) {
    this.cache = cache;
    this.tts = tts;
  }

  async play(source: string, text: string) {
    const key = await Hash.sha256(`${source}:${text}`);

    const existAudioUrl = await this.cache.get(key);

    let audioUrl: string | null = null;

    if (existAudioUrl) {
      audioUrl = existAudioUrl;
    } else {
      audioUrl = await this.tts.getAudioUrl(source, text);

      if (!audioUrl) {
        return;
      }

      await this.cache.add(key, audioUrl);
    }

    if (!audioUrl) {
      return;
    }

    this.audio.volume = 0;
    this.audio.src = audioUrl;
    await this.audio.play();
    this.audio.volume = 1;

    // Waiting for playback to finish
    await new Promise<void>((resolve) => {
      this.audio.addEventListener("ended", () => resolve(), { once: true });
    });
  }
}
