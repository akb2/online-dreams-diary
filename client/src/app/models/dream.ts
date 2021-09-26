// Интерфейс сновидения
export interface Dream {
  id: number;
  userId: number;
  createDate: Date;
  date: Date;
  title: string;
  keywords: string[];
  text: string;
  places: Place[] | null;
  members: number[] | null;
  map: DreamMap | null;
  mode: DreamMode;
}

// Интерфейс локаций
export interface Place {
  id: number;
  userId: number;
  name: string;
  description: string;
  isReal: boolean;
}

// Интерфейс пути сновидца в сновидении
export interface DreamerWay {
  coord: Coord;
  color: WayColor;
  lineType: WayLineType;
}





// Интерфейс карты
export interface DreamMap {
  ceils: (DreamMapCeil | null)[];
  dreamerWay: DreamerWay[] | null;
}

// Интерфейс ячейки сновидения
export interface DreamMapCeil {
  place: Place | null;
  terrain: MapTerrain | null;
  object: MapObject | null;
}

// Интерфейс типа местности
export interface MapTerrain {
  id: number;
  name: string;
}

// Интерфейс объекта карты
export interface MapObject {
  id: number;
  name: string;
}





// Интерфейс координат
export interface Coord {
  x: number;
  y: number;
}

// Тип сновидения
export enum DreamMode {
  text,
  map
}

// Типы цветов пути
export type WayColor = "red" | "green" | "blue" | "white" | "black" | "gray" | "orange" | "pink" | "pink" | "purple";

// Тип линии
export interface WayLineType {
  type: CssBorderType;
  title: string;
  description: string;
}

// Тип CSS границы
export type CssBorderType = "solid" | "double" | "dashed" | "dotted";





// Набор типов линий
export const WayLineTypes: WayLineType[] = [{
  type: "solid",
  title: "Ходьба / езда",
  description: "Перемещение пешком, автомобиле, велосипеде и т.д."
}, {
  type: "double",
  title: "Полет",
  description: "Персонаж летит сам, или на транспорте, или другом существе"
}, {
  type: "dashed",
  title: "Плавание",
  description: "Персонаж плывет сам, или на транспорте, или на другом существе"
}, {
  type: "dotted",
  title: "Телепортация",
  description: "Персонаж перемещается из одной точки в другую, минуя пространство"
}];