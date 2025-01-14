import * as googleTtsApi from "google-tts-api";
import { requestUrl } from "obsidian";

const arrayBufferToBase64 = async (arrayBuffer: ArrayBuffer) => {
  const binaryString = String.fromCharCode(...new Uint8Array(arrayBuffer));
  return btoa(binaryString);
};

export class Tts {
  async getAudioUrl(language: string, text: string) {
    try {
      const audioUrl = await googleTtsApi.getAudioUrl(text, {
        lang: language,
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
