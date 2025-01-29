import * as googleTtsApi from "google-tts-api";

import { IServer } from "./types";
import { requestUrl } from "obsidian";
import translate from "translate";

const arrayBufferToBase64 = async (arrayBuffer: ArrayBuffer) => {
  const binaryString = String.fromCharCode(...new Uint8Array(arrayBuffer));
  return btoa(binaryString);
};

export class Free implements IServer {
  async getTranslation(source: string, target: string, text: string) {
    try {
      return await translate(text, {
        from: source,
        to: target,
      });
    } catch (e) {
      return null;
    }
  }

  async getAudioUrl(source: string, text: string) {
    try {
      const audioUrl = await googleTtsApi.getAudioUrl(text, {
        lang: source,
        slow: false,
        host: "https://translate.google.com",
      });

      const response = await requestUrl({
        url: audioUrl,
        method: "GET",
      });

      const base64String = await arrayBufferToBase64(response.arrayBuffer);

      const base64Url = `data:audio/wav;base64,${base64String}`;

      return base64Url;
    } catch (e) {
      return null;
    }
  }
}
