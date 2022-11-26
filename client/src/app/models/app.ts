import { MatDialogConfig } from "@angular/material/dialog";
import { XYCoord } from "@_models/dream-map";
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





// Проверка числа на четность
export const IsEven: (num: number) => boolean = (num: number) => num / 2 === Math.round(num / 2);

// Проверка числа на нечетность
export const IsOdd: (num: number) => boolean = (num: number) => !IsEven(num);

// Проверка числа на нечетность
export const IsMultiple: (num: number, del: number) => boolean = (num: number, del: number) => num / del === Math.round(num / del);

// Градусы в радианы
export const AngleToRad: (angle: number) => number = (angle: number) => (Math.PI * angle) / 180;

// Радианы в градусы
export const RadToAngle: (rad: number) => number = (rad: number) => (rad * 180) / Math.PI;

// Синус угла
export const Sin: (angle: number) => number = (angle: number) => MathRound(Math.sin(AngleToRad(angle)), 10);

// Косинус угла
export const Cos: (angle: number) => number = (angle: number) => MathRound(Math.cos(AngleToRad(angle)), 10);

// Тангенс угла
export const Tan: (angle: number) => number = (angle: number) => MathRound(Math.tan(AngleToRad(angle)), 10);

// Катангенс угла
export const Ctg: (angle: number) => number = (angle: number) => MathRound(1 / Math.tan(AngleToRad(angle)), 10);

// Округление после запятой
export const MathRound: (value: number, afterDotNum?: number) => number = (value: number, afterDotNum: number = 0): number => {
  if (afterDotNum > 0) {
    const sqrt: number = Math.pow(10, afterDotNum);
    return Math.round((value * sqrt)) / sqrt;
  }
  // Округлить до целого
  return Math.round(value);
};

// Случайное число
export const Random: (min: number, max: number, noBorder?: boolean, afterDotNum?: number) => number =
  (min: number, max: number, noBorder: boolean = false, afterDotNum: number = 0) => {
    const border: number = noBorder ? 1 / Math.pow(10, afterDotNum) : 0;
    // Параметры
    min = min + border;
    max = max - border;
    // Вернуть случайное число
    return MathRound(Math.random() * (max - min) + min, afterDotNum);
  };

// Площадь треугольника
export const TriangleSquare: (a: XYCoord | XYCoord[], b?: XYCoord, c?: XYCoord) => number = (a: XYCoord | XYCoord[], b: XYCoord = null, c: XYCoord = null) => {
  if (Array.isArray(a)) {
    [, b, c] = a;
    a = a[0] as unknown as XYCoord;
  }
  // Вернуть площадь или ошибку
  return !!a && !!b && !!c ?
    0.5 * (Math.abs((a.x - c.x) * (b.y - c.y) - (b.x - c.x) * (a.y - c.y))) :
    0;
};

// Расстояние между двумя точками
export const LengthByCoords: (a: XYCoord, b?: XYCoord) => number = (a: XYCoord, b: XYCoord = { x: 0, y: 0 }) =>
  Math.sqrt(Math.pow(Math.abs(a.x - b.x), 2) + Math.pow(Math.abs(a.y - b.y), 2));

// Линейная функция расчета
export const LineFunc: (min: number, max: number, value: number, valueMin: number, valueMax: number) => number =
  (min: number, max: number, value: number, valueMin: number, valueMax: number) => (((min - max) / valueMax) * (value - valueMin)) + max;

// Цикл из числа
export const CreateArray: (length: number) => number[] = (length: number) => Array.from(Array(length).keys());

// Случайный элемент массива
export const ArrayRandom: <T>(data: T[]) => T = <T>(data: T[]) => data[Random(0, data.length - 1, false, 0)];
