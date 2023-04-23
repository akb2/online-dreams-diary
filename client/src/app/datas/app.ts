import { MathRound, Random } from "@_helpers/math";
import { CustomObject, FileTypes, MultiObject, SimpleObject } from "@_models/app";
import { MatDialogConfig } from "@angular/material/dialog";





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

// Случайный элемент массива
export const ArrayRandom: <T>(data: T[]) => T = function <T>(data: T[]) {
  return data[Random(0, data.length - 1, false, 0)];
};

// Преобразовать в массив
export const ToArray: <T>(d: any, c?: (d: any) => T) => T[] = function <T>(data: any, mapCallback = d => d as T) {
  return (Array.isArray(data) ? data : [data]).map(mapCallback);
};

// Пересечение элемента по селектору
export const CompareElementBySelector = (target: any, selector: string) => {
  if (!!target && !!selector?.length) {
    const match = e => e !== document && !!(e as Element).matches(selector);
    let element: any = target;
    // Поиск пересечения
    while (element.parentNode && !match(element)) {
      element = element.parentNode;
    }
    // Проверка
    return match(element);
  }
  // Нет пересечения
  return false;
}

// Пересечение элемента
export const CompareElementByElement = (target: any, elm: any) => {
  if (!!target && !!elm) {
    const match = e => e !== document && e === elm;
    let element: any = target;
    // Поиск пересечения
    while (element.parentNode && !match(element)) {
      element = element.parentNode;
    }
    // Проверка
    return match(element);
  }
  // Нет пересечения
  return false;
}

// Проверка массива ключей в многомерном объекте
export const ObjectHasValueByFields = <T>(object: T | MultiObject<T>, ...mixedFields: string[]) => {
  const fields: string[] = mixedFields.length > 1 ? mixedFields : mixedFields[0].split(".");
  let iObject: T | MultiObject<T> = object;
  let result: boolean = true;
  // Поиск значений
  if (!!fields?.length && !!object) {
    fields.forEach(field => {
      if (!!iObject?.hasOwnProperty(field)) {
        iObject = iObject[field];
      }
      // Ключа нет
      else {
        result = false;
      }
    });
  }
  // Некорректные входные данные
  else {
    result = false;
  }
  // Вернуть результат проверки
  return result;
}

// Получение значения из многомерного объекта по массиву ключей
export const GetObjectValueByFields = <T>(object: T | MultiObject<T>, ...mixedFields: string[]) => {
  const fields: string[] = mixedFields.length > 1 ? mixedFields : mixedFields[0].split(".");
  if (ObjectHasValueByFields(object, ...fields)) {
    let target: T | MultiObject<T> = object;
    // Поиск значения
    fields.forEach(field => target = target[field] ?? null);
    // Вернуть значение
    return target as (T | MultiObject<T> | CustomObject<T>);
  }
  // Пустое значение
  return null;
}

// Установить значение в многомерном объекте по массиву ключей
export const SetObjectValueByFields = <T>(object: T | MultiObject<T>, value: T, ...mixedFields: string[]) => {
  const fields: string[] = mixedFields.length > 1 ? mixedFields : mixedFields[0].split(".");
  let iObject: T | MultiObject<T> = object;
  // Поиск значения
  fields.forEach((field, key) => {
    iObject[field] = iObject[field] ?? (key < fields.length - 1 ? {} : value);
    iObject = iObject[field];
  });
}

// Сколлапсировать многомерный объект до одномерного
export const CollapseObject = <T>(object: T | MultiObject<T>) => {
  let targetObject: CustomObject<T> = {};
  // Функция поиска значений
  const getItems = (iObject: MultiObject<T> | T, keyPreffix: string = "") => {
    const keys: string[] = Object.keys(iObject);
    // Объект
    if (!!keys?.length && typeof iObject === "object") {
      keys.forEach(key => getItems(iObject[key], keyPreffix + (!!keyPreffix ? "." : "") + key));
    }
    // Простое значение типа T
    else if (iObject !== undefined) {
      targetObject[keyPreffix] = iObject as T;
    }
  };
  // Начало поиска
  getItems(object);
  // Вернуть результат
  return targetObject;
};

// Прокручиваемый элемент
export const ScrollElement: () => HTMLElement = () => document.getElementById("app_main_page");

// Элемент компонента страницы
export const PageComponentElement = () => ScrollElement()?.getElementsByTagName("router-outlet")?.item(0)?.nextElementSibling as HTMLElement;
