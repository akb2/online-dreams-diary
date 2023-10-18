// Интерфейс картинки фона
export interface BackgroundImageData {
  id: number;
  title: string;
  imageName: string;
  imageNameShort: string;
  positionX: BackgroundHorizontalPosition;
  positionY: BackgroundVerticalPosition;
  imageOverlay: boolean;
}

// Тип горизонтального позиционирования картинки
export type BackgroundHorizontalPosition = "left" | "center" | "right";
export type BackgroundHorizontalPositionV2 = "start" | "center" | "end";

// Тип горизонтального вертикального картинки
export type BackgroundVerticalPosition = "top" | "center" | "bottom";
