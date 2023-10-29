import { AuthRules } from "@_models/menu";





// Многомерный рекурсивный массив
export type MultiArray<T> = T[] | MultiArray<T>[];

// Тип базового одномерного объекта
export type SimpleObject = { [key: string]: string };
export type CustomObject<V> = { [key: string]: V };
export type CustomObjectKey<K, V> = { [key in K as string | number | symbol]: V };
export type MultiObject<V> = { [key: string]: V | MultiObject<V> };

// Тип иконки
export enum IconType {
  default,
  svg
}

// Данные для Local Storage
export interface LocalStorageItemInterface<T = any> {
  value: T;
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

// Массив иконок для Material icons
export interface CustomMaterialIcon {
  keys: string[];
  path: string;
}

// Ключ по умолчанию
export const DefaultKey = "default";

// Цветовые схемы всплывающих сообщений
type SnackbarPropMode = "success" | "error" | "info";

// Интерфейс цветов
export type IconColor = "primary" | "accent" | "warn" | "disabled";

// Интерфейс цветов фона
export type IconBackground = "fill" | "transparent";

// Допустимые типы JPG
export type JpegTypes = "image/jpeg" | "image/jpg";

// Допустимые типы изображений
export type FileTypes = JpegTypes | "image/gif" | "image/png";
