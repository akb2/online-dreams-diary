import { Language, LanguageSetting, SiteDomain } from "@_models/translate";
import { CustomObjectKey } from "@akb2/types-tools";





// Ключ в локал сторадже
export const LanguageLocalStorageKey: string = "language";
export const LocalStorageTtl: number = 0;


// Язык по умолчанию
export const DefaultLanguage: Language = Language.en;

// Настройка языка по умолчанию
export const DefaultLanguageSetting: LanguageSetting = {
  defaultLanguage: Language.en
};

// Основной домен для языка
export const DomainByLanguage: CustomObjectKey<Language, SiteDomain> = {
  [Language.en]: "dreams-diary.com",
  [Language.ru]: "dreams-diary.ru"
};

// Массив языков для доменов
export const LanguageSettings: CustomObjectKey<SiteDomain, LanguageSetting> = {
  "dreams-diary.ru": {
    defaultLanguage: Language.ru
  },
  "dreams-diary.su": {
    defaultLanguage: Language.ru
  },
  "дневник-сновидений.рф": {
    defaultLanguage: Language.ru
  }
};

// Массив локалей
export const LanguageLocales: CustomObjectKey<Language, string> = {
  [Language.en]: "en-US",
  [Language.ru]: "ru-RU"
};

// Массив первых дней для локалей
export const LanguageFirstDayOfWeek: CustomObjectKey<Language, number> = {
  [Language.en]: 7,
  [Language.ru]: 1
};
