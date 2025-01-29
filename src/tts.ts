import { requestUrl } from "obsidian";

export class TTS {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async tts(source: string, text: string): Promise<string | null> {
    try {
      const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`;

      const requestBody = {
        input: { text: text },
        voice: {
          languageCode: source,
          ssmlGender: "NEUTRAL",
        },
        audioConfig: { audioEncoding: "MP3" },
      };

      const response = await requestUrl({
        method: "POST",
        url,
        contentType: "application/json",
        body: JSON.stringify(requestBody),
      });

      const json = await response.json;

      if (!json?.audioContent) {
        return null;
      }

      return json.audioContent || null;
    } catch (e) {
      return null;
    }
  }
}
