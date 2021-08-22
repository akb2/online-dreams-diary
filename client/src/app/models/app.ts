import { MatDialogConfig } from "@angular/material/dialog";
import { AuthRules } from "@_models/menu";

// Тип базового одномерного объекта
export type SimpleObject = { [key: string]: string };
export type CustomObject<T> = { [key: string]: T };

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
  Win10: "Windows 10"
};