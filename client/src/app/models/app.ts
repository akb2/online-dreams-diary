import { AuthRules } from "@_models/menu";





// Многомерный рекурсивный массив
export type MultiArray<T> = T[] | MultiArray<T>[];

// Тип базового одномерного объекта
export type SimpleObject = { [key: string]: string };
export type CustomObject<V> = { [key: string]: V };
export type CustomObjectKey<K, V> = { [key in K as string | number | symbol]: V };
export type MultiObject<V> = { [key: string]: V | MultiObject<V> };

// Данные для Cookie
export interface CookieInterface {
  value: any;
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

// Информация о браузере
export interface BrowserInfo {
  os: string;
  name: string;
  version: string;
}

// Цветовые схемы всплывающих сообщений
type SnackbarPropMode = "success" | "error" | "info";

// Интерфейс цветов
export type IconColor = "primary" | "accent" | "warn" | "disabled";

// Интерфейс цветов фона
export type IconBackground = "fill" | "transparent";

// Допустимые типы файлов
export type FileTypes = "image/gif" | "image/jpeg" | "image/png";
