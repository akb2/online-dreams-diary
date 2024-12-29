import { UrlParamsStringToObject } from "@_datas/api";
import { CreateArray } from "@_datas/app";
import { YouTubeVideoBase } from "@_models/comment";
import { ParseInt, Random } from "./math";



// Преобразование любого значения в строку
export const AnyToString = (value: any, defaultTitle = "") => value?.toString() ?? defaultTitle;

// Генерация уникального ID
export const CreateRandomID = (length: number) => {
  const characters: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const charactersLength: number = characters.length;
  // Генерация
  return CreateArray(length)
    .map(() => characters.charAt(Math.floor(Math.random() * charactersLength)))
    .map(letter => !!Random(0, 1) ? letter.toLowerCase() : letter)
    .join("");
}

// Сделать первую букву заглавной
export const CapitalizeFirstLetter = (mixedText: string) => {
  const text: string = (mixedText ?? "").toLowerCase();
  // Поднять первую бкуву
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Регулярное выражение для поиска URL в тексте
export const SearchUrlRegExp = /(https?:\/\/[^\s<>\[\],!]+(?<![.,!?]))/gi;

// Регулярное выражение для проверки ссылки, что она является ссылкой на сон
export const SearchDreamUrlRegExp = new RegExp("^https?:\/\/" + window.location.hostname + "(:[0-9]{1,5})?\/diary\/viewer\/([0-9]+)(.*)?$", "i");

// Регулярное выражение для проверки ссылки, что она является ссылкой на видео YouTube
export const SearchYouTubeVideoUrlRegExps: [RegExp, number][] = [
  [new RegExp("^https:\\/\\/(www\\.)?youtube\\.com\\/watch(\\/|\\?)(.*)?$", "i"), -1],
  [new RegExp("^https:\\/\\/(www\\.)?youtube\\.com\\/watch\\/([A-z0-9\\-_]{11})(\\/|\\?)?(.*)?$", "i"), 2],
  [new RegExp("^https:\\/\\/(www\\.)?youtube\\.com\\/live\\/([A-z0-9\\-_]{11})(\\/|\\?)?(.*)?$", "i"), 2],
  [new RegExp("^https:\\/\\/youtu\\.be\\/\\?(.*)?$", "i"), -1],
  [new RegExp("^https:\\/\\/youtu\\.be\\/([A-z0-9\\-_]{11})(\\/|\\?)?(.*)?$", "i"), 1]
];

// Получить список всех ссылок
export const GetLinksFromString = (text: string) => {
  const urlRegex: RegExp = SearchUrlRegExp;
  const result: string[] = [];
  let match: RegExpExecArray;
  // Перебираем все совпадения с регулярным выражением
  while ((match = urlRegex.exec(text)) !== null) {
    const matchedUrl = match[0];
    // Проверяем на уникальность
    if (!result.includes(matchedUrl)) {
      result.push(matchedUrl);
    }
  }
  // Вернуть результат
  return result;
};

// Ссылка я вляется ссылкой на дневник сновидений
export const IsDreamUrl = (url: string) => SearchDreamUrlRegExp.test(url);

// Ссылка я вляется ссылкой на дневник сновидений
export const IsYouTubeVideoUrl = (url: string) => !!GetYouTubeDataByUrl(url)?.id;

// Ид сновидения по ссылке
export const GetDreamIdByUrl = (url: string) => ParseInt(url.replace(SearchDreamUrlRegExp, "$2"));

// Данные о YouTube видео по ссылке
export const GetYouTubeDataByUrl = (url: string): YouTubeVideoBase => {
  for (let [regExp, idKey] of SearchYouTubeVideoUrlRegExps) {
    const match = url.match(regExp);
    // Анализ вхождений
    if (!!match) {
      const link = match[0];
      const params = UrlParamsStringToObject(link.split("?")[1]);
      const id = AnyToString(idKey >= 0
        ? match?.[idKey]
        : params?.["v"]
      );
      const startTime = ParseInt(params?.["t"], 0);
      // Удалось извлечь ID
      if (!!id) {
        return {
          link,
          id,
          startTime
        };
      }
    }
  }
  // Ничего не найдено
  return null;
};
