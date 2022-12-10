import { MatDialogConfig } from "@angular/material/dialog";
import { Random } from "@_models/math";
import { AuthRules } from "@_models/menu";





// Многомерный рекурсивный массив
export type MultiArray<T> = T[] | MultiArray<T>[];

// Тип базового одномерного объекта
export type SimpleObject = { [key: string]: string };
export type CustomObject<V> = { [key: string]: V };
export type CustomObjectKey<K, V> = { [key in K as string | number | symbol]: V };

// Данные для Cookie
export interface CookieInterface {
  value: string;
  expiry: number;
}

// Входящие данные
export interface SnackbarProps {
  message: string;
  action?: string;
  mode?: SnackbarPropMode;
}

// Данные роутов
export interface RouteData {
  title?: string;
  userId?: number;
  authRule?: AuthRules;
  redirectAuth?: string;
  redirectNotAuth?: string;
}

// Цветовые схемы всплывающих сообщений
type SnackbarPropMode = "success" | "error" | "info";

// Интерфейс цветов
export type IconColor = "primary" | "accent" | "warn" | "disabled";

// Интерфейс цветов фона
export type IconBackground = "fill" | "transparent";

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

// Информация о браузере
export interface BrowserInfo {
  os: string;
  name: string;
  version: string;
}

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
