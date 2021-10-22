import { OptionData } from "@_controlers/autocomplete-input/autocomplete-input.component";
import { User } from "@_models/account";
import { BackgroundImageData } from "@_models/appearance";
import { NavMenuType } from "@_models/nav-menu";





// Интерфейс сновидения API
export interface DreamDto {
  id: number;
  userId: number;
  createDate: string;
  date: string;
  title: string;
  description: string;
  keywords: string;
  text: string;
  places: string;
  members: string;
  map: string;
  mode: DreamMode;
  headerType: NavMenuType;
  headerBackgroundId: number;
}

// Интерфейс сновидения
export interface Dream {
  id: number;
  user: User;
  createDate: Date;
  title: string;
  date: Date;
  description: string;
  mode: DreamMode;
  keywords: string[];
  places: Place[] | null;
  members: number[] | null;
  text: string;
  map: DreamMap | null;
  headerType: NavMenuType;
  headerBackground: BackgroundImageData;
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
  map,
  mixed
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

// Набор методов для типа новидения
export const DreamModes: OptionData[] = [{
  key: DreamMode.text.toString(),
  title: "В виде текста",
  icon: "notes",
  iconColor: "primary",
  iconBackground: "fill"
}, {
  key: DreamMode.map.toString(),
  title: "В виде карты",
  icon: "explore",
  iconColor: "primary",
  iconBackground: "fill"
}, {
  key: DreamMode.mixed.toString(),
  title: "В виде карты и описания",
  icon: "library_books",
  iconColor: "primary",
  iconBackground: "fill"
}];