declare module "snowball-stemmers" {
  export type StemmetLanguages = "russian";
  export const newStemmer: (language: StemmetLanguages) => Stemmer;
  interface Stemmer {
    stem: (word: string) => string;
  }
}
