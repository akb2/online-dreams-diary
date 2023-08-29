import { CreateArray } from "@_datas/app";
import { Random } from "./math";





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
export const SearchUrlRegExp: RegExp = /(https?:\/\/[^\s<>\[\],!]+(?<![.,!?]))/gi;

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
