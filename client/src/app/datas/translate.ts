import { CustomObjectKey } from "@_models/app";
import { Language, LanguageSetting, SiteDomain } from "@_models/translate";





// Язык по умолчанию
export const DefaultLanguage: Language = Language.ru;

// Настройка языка по умолчанию
const DefaultLanguageSetting: LanguageSetting = {
  defaultLanguage: Language.en,
  availlanguages: [Language.ru]
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
  },
  "dreams-diary.com": DefaultLanguageSetting,
  "dreams-diary.net": DefaultLanguageSetting,
  "dreams-diary.org": DefaultLanguageSetting
};
