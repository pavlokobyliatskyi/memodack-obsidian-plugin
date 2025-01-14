import translate from "translate";

export class Translation {
  async translate(from: string, to: string, text: string) {
    try {
      return await translate(text, {
        from,
        to,
      });
    } catch (e) {
      return null;
    }
  }
}
