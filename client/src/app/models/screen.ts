import { NumberDirection } from "./math";





// Ключи названий экранов
export type ScreenKeys = "default" | "xxsmall" | "xsmall" | "small" | "middle" | "large" | "xlarge";

// Направление движения скролла
export type ScrollAddDimension = "top" | "right" | "bottom" | "left";

// Тип данных для размеров экрана
export interface ScreenBreakpoints {
  default: number;
  xxsmall: number;
  xsmall: number;
  small: number;
  middle: number;
  large: number;
  xlarge: number;
}

// Интерфейс размеров элемента
export interface ElmSize {
  element: HTMLElement;
  width: number;
  height: number;
}

// Интерфейс данных скролла
export interface ScrollData {
  x: number;
  y: number;
  maxX: number;
  maxY: number;
  elm?: HTMLElement;
  scrollableHeight?: number;
  lastDirectionX?: NumberDirection;
  lastDirectionY?: NumberDirection;
  lastScrollAddedY?: number;
  emitEvent?: boolean;
}

// Установка значений скролл
export interface SetScrollData extends ScrollToOptions {
  emitEvent?: boolean;
}

// Данные о загруженной картинке
export class LoadingImageData {
  constructor(
    public image: HTMLImageElement,
    public url: string,
    public width: number,
    public height: number,
  ) { }
}

// Перечисление расширения картинок
export enum ImageExtension {
  jpg = "jpg",
  jpeg = "jpeg",
  png = "png"
}
