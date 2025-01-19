export interface IWord {
  value: string; // or key?
  translation: string; // and value?
}

// Free, Personal
export interface IServer {
  getTranslation: (
    source: string,
    target: string,
    text: string
  ) => Promise<string | null>;
  getAudioUrl: (source: string, text: string) => Promise<string | null>;
}

export type TServer = "free" | "personal";
