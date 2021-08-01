// Тип базового одномерного объекта
export type SimpleObject = { [key: string]: string };

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

// Цветовые схемы всплывающих сообщений
type SnackbarPropMode = "success" | "error" | "info";

// Интерфейс цветов
export type IconColor = "primary" | "accent" | "warn" | "disabled";

// Интерфейс цветов фона
export type IconBackground = "fill" | "transparent";