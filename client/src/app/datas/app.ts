import { MatDialogConfig } from "@angular/material/dialog";
import { MathRound, Random } from "@_helpers/math";
import { FileTypes, SimpleObject } from "@_models/app";





// Настройки для диалоговых окон по умолчанию
export const AppMatDialogConfig: MatDialogConfig = {
  width: "auto",
  maxWidth: "100vw",
  maxHeight: "100vh",
  closeOnNavigation: true,
  role: "dialog",
  autoFocus: false,
  restoreFocus: false
}

// Пустая функция
export const VoidFunctionVar: VoidFunction = () => { };

// Преобразовать в дату
export const ToDate = (mixedDate: any, defaultDate: Date = new Date()) => typeof mixedDate === "string" || typeof mixedDate === "number" ?
  new Date(mixedDate) : typeof mixedDate === "object" && mixedDate instanceof Date ?
    mixedDate :
    defaultDate;

// Преобразовать в массив
export const ToArray = <T>(data: any, mapCallback: (d: any) => T = d => d as T) => (Array.isArray(data) ? data : [data]).map(mapCallback);

// Данные об операционных системах
export const OsNames: SimpleObject = {
  Win7: "Windows 7",
  Win8: "Windows 8",
  "Win8.1": "Windows 8.1",
  Win10: "Windows 10",

  Linux: "Linux",
  Ubuntu: "Ubuntu",
  Android: "Android OS",

  macOS: "Mac OS",
  MacOSX: "Mac OS X",
  iOS: "iOS",

  unknown: "Неопределена"
};

// Данные об операционных системах
export const BrowserNames: SimpleObject = {
  Chrome: "Google Chrome",
  Opera: "Opera",

  IE: "Internet Explorer",
  Edge: "Microsoft Edge",

  Firefox: "Mozilla Firefox",

  Safari: "Safari",

  "Default Browser": "Неопределен",
};

// Цикл из числа
export const CreateArray: (length: number) => number[] = (length: number) => Array.from(Array(length).keys());

// Случайный элемент массива
export const ArrayRandom: <T>(data: T[]) => T = <T>(data: T[]) => data[Random(0, data.length - 1, false, 0)];

// Типы файлов по умолчанию
export const FileTypesDefault: FileTypes[] = [
  "image/jpeg",
  "image/png"
];

// Минимальный размер аватара
export const AvatarMaxSize: number = 10485760;





// Получить размер файла
export const ConvertFileSize = (size: number) => {
  const strings: string[] = ["Б", "КБ", "МБ", "ГБ", "ТБ"];
  let key: number = 0;
  // Преобразовать данные
  while (size > 1024 && key < strings.length) {
    size = size / 1024;
    key++;
  }
  // Преобразование неудалось
  return MathRound(size) + " " + strings[key];
}
