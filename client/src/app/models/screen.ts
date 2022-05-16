// Ключи названий экранов
export type ScreenKeys = "default" | "xsmall" | "small" | "middle" | "large" | "xlarge";

// Тип данных для размеров экрана
export interface ScreenBreakpoints {
  default: number;
  xsmall: number;
  small: number;
  middle: number;
  large: number;
  xlarge: number;
}

// Данные о загруженной картинке
export class LoadingImageData {
  constructor(
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
