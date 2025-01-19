import { Personal } from "personal";

export class Ping {
  static async ping(url: string, xApiKey: string): Promise<boolean> {
    const personal = new Personal(url, xApiKey);
    const translation = await personal.getTranslation("en", "uk", "ping");

    if (!translation || translation !== "пінг") {
      return false;
    }

    return true;
  }
}
