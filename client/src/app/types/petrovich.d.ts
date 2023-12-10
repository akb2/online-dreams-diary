
declare module "petrovich" {
  /**
   * Список полов
   */
  export type NameSex = "male"
    | "female"
    | "androgynous";
  /**
   * Список типов имен
   */
  export type NameKey = "first"
    | "middle"
    | "last";
  /**
   * Список склонений
   */
  export type DeclineKey = "nominative"
    | "genitive"
    | "dative"
    | "accusative"
    | "instrumental"
    | "prepositional";
  /**
   * Функция определения пола для имени
   * @param {string} word Имя для которого требуется определить пол
   * @return {NameSex} Название пола
   */
  export type GetDeclinedName = (word: string) => string;
  /**
   * Массив склонений
   */
  export interface WordsDeclinesLib {
    accusative: GetDeclinedName;
    dative: GetDeclinedName;
    genitive: GetDeclinedName;
    instrumental: GetDeclinedName;
    nominative: GetDeclinedName;
    prepositional: GetDeclinedName;
  }
  /**
   * Массив по типу имен
   */
  export interface WordsNameKeysLib {
    first: WordsDeclinesLib;
    middle: WordsDeclinesLib;
    last: WordsDeclinesLib;
  }
  /**
   * Массив полов
   */
  export interface WordsSexLib {
    male: WordsNameKeysLib;
    female: WordsNameKeysLib;
    androgynous: WordsNameKeysLib;
  }
  /**
   * Массив слов
   */
  const datas: WordsSexLib;
  /**
   * Функция определения пола для имени
   * @param {string} word Имя для которого требуется определить пол
   * @return {NameSex} Название пола
   */
  export const detect_gender: (word: string) => NameSex;
  /**
   * Экспорт по умолчанию
   */
  export default datas;
}
