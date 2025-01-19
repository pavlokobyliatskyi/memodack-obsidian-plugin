import { requestUrl } from "obsidian";
import { IServer } from "types";

export class Personal implements IServer {
  url: string;
  xApiKey: string;
  xApiVersion = "1";

  constructor(url: string, xApiKey: string) {
    this.url = url;
    this.xApiKey = xApiKey;
  }

  async getTranslation(source: string, target: string, text: string) {
    try {
      const response = requestUrl({
        method: "GET",
        url: `${this.url}/translate?source=${source}&target=${target}&text=${text}`,
        headers: {
          "x-api-version": this.xApiVersion,
          "x-api-key": this.xApiKey,
        },
      });

      const json = await response.json;

      if (json.data.status === "error") {
        return null;
      }

      return json.data.translation;
    } catch (e) {
      return null;
    }
  }

  async getAudioUrl(source: string, text: string) {
    try {
      const response = requestUrl({
        method: "GET",
        url: `${this.url}/tts?source=${source}&text=${text}`,
        headers: {
          "x-api-version": this.xApiVersion,
          "x-api-key": this.xApiKey,
        },
      });

      const json = await response.json;

      if (json.data.status === "error") {
        return null;
      }

      return json.data.audioUrl;
    } catch (e) {
      return null;
    }
  }
}
