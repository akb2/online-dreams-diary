// Модель языков
export enum Language {
  en = "en",
  ru = "ru",
}

// Домены сайта
export type SiteDomain = "dreams-diary.ru"
  | "dreams-diary.com"
  | "dreams-diary.net"
  | "dreams-diary.org"
  | "dreams-diary.su"
  | "дневник-сновидений.рф";

// Настройки языка
export interface LanguageSetting {
  defaultLanguage: Language;
  availlanguages?: Language[];
}
