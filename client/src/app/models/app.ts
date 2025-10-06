import { AuthRules } from "@_models/menu";





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

// Типы контекстов
export type CanvasContextType = "2d" | "bitmaprenderer" | "webgl" | "webgl2";

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
