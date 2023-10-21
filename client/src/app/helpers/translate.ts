import { DefaultLanguage, DefaultLanguageSetting, LanguageLocalStorageKey, LanguageSettings } from "@_datas/translate";
import { Language, LanguageSetting } from "@_models/translate";
import { IsInEnum } from "./app";
import { LocalStorageGet } from "./local-storage";





// Получить язык из хранилища
export const GetLanguageFromLocalStorage = (): Language => {
  const mixedLanguage: string = LocalStorageGet(LanguageLocalStorageKey);
  // Вернуть язык
  return IsInEnum(mixedLanguage, Language) ?
    mixedLanguage as Language :
    null;
}

// Получить из информации о браузере
export const GetLanguageFromBrowser = (): Language => {
  const mixedLanguage: string = navigator.language.split('-')[0];
  // Вернуть язык
  return IsInEnum(mixedLanguage, Language) ?
    mixedLanguage as Language :
    null;
}

// Язык для сайта по домену по умолчанию
export const GetLanguageFromDomainSetting = (): Language => {
  const domain: string = window.location.hostname;
  const languageSettings: LanguageSetting = LanguageSettings?.[domain] ?? DefaultLanguageSetting;
  // Вернуть язык
  return languageSettings?.defaultLanguage ?? DefaultLanguage;
}

// Определить текущий язык
export const GetDetectedLanguage = (): Language => {
  const localStorageLanguage: Language = GetLanguageFromLocalStorage();
  const browserLanguage: Language = GetLanguageFromBrowser();
  const siteDefaultLanguage: Language = GetLanguageFromDomainSetting();
  // Определение языка
  return localStorageLanguage ?? browserLanguage ?? siteDefaultLanguage;
}
