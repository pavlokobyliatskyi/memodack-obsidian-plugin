export interface IWord {
  value: string;
  translation: string;
}

export type TPlayOnClick =
  | "nothing"
  | "value"
  | "translation"
  | "value-and-translation"
  | "translation-and-value";
