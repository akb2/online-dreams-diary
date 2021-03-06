import { Place } from "@_models/dream";
import { ImageExtension } from "@_models/screen";
import { Light, MeshStandardMaterial, Side, Texture } from "three";





// Интерфейс карты
export interface DreamMap {
  ceils: (DreamMapCeil | null)[];
  camera: DreamMapCameraPosition;
  size: MapSize;
  dreamerWay: DreamerWay[] | null;
  skyBox: number;
}

// Интерфейс данных позиции камеры
export interface DreamMapCameraPosition {
}

// Интерфейс ячейки сновидения
export interface DreamMapCeil {
  place: Place | null;
  terrain: number;
  object: MapObject | null;
  highlight?: boolean;
  waterHightlight?: number;
  coord: Coord;
  water: Water;
}

// Интерфейс типа местности
export interface MapTerrain {
  id: number;
  name: string;
  title: string;
  isAvail: boolean;
  exts: {
    face: ImageExtension;
    ao: ImageExtension;
    disp: ImageExtension;
    normal: ImageExtension;
  };
  settings: MapTerrainSettings;
}

// Интерфейс настроек типа местности
export interface MapTerrainSettings {
  colorR: number;
  colorG: number;
  colorB: number;
  metalness: number;            // Металличность
  roughness: number;            // Шероховатость
  aoMapIntensity: number;       //
  displacementScale: number;    //
  envMapIntensity: number;      //
  normalScale: number;          //
}

// Интерфейс типа неба
export interface MapSkyBox {
  id: number;
  name: string;
  title: string;
  fogColor: number;
  lights: MapSkyBoxLight[];
}

// Интерфейс освещения
interface MapSkyBoxLight {
  light: Light;
  target: SkyBoxLightTarget;
  position?: CoordDto;
  fixed?: boolean;
  shadow?: {
    near: number;
    far: number;
    top: number;
    left: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
    radius: number;
  };
}

// Перебор для назначения освещения
export enum SkyBoxLightTarget {
  Scene = "Scene",
  Camera = "Camera"
}

// Интерфейс объекта карты
export interface MapObject {
  id: number;
  name: string;
}

// Интерфейс карты для сервера
export interface DreamMapDto {
  ceils: (DreamMapCeilDto | null)[];
  camera?: DreamMapCameraPosition;
  size: MapSize;
  dreamerWay: DreamerWay[] | null;
  skyBox: number | null;
}

// Интерфейс ячейки сновидения
export interface DreamMapCeilDto {
  place?: number | null;
  terrain?: number | null;
  object?: number | null;
  coord?: CoordDto;
  water?: WaterDto;
}





// Интерфейс пути сновидца в сновидении
export interface DreamerWay {
  coord: Coord;
  color: WayColor;
  lineType: WayLineType;
}

// Интерфейс размера
export interface MapSize {
  width: number;
  height: number;
  zHeight: number;
}

// Интерфейс 2D координат
export interface XYCoord {
  x: number;
  y: number;
}

// Интерфейс координат
export interface Coord extends CoordDto {
  originalZ: number;
}

// Интерфейс координат для сервера
export interface CoordDto extends XYCoord {
  z: number;
}

// Интерфейс воды
export interface Water {
  z: number;
  type: WaterType;
  material: number;
}

// Интерфейс воды для сервера
export interface WaterDto {
  z: number | null;
  type: WaterType | null;
  material: number | null;
}

// Перечисления типа воды
export enum WaterType {
  pool,
  stream
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

// Типы текстур
export type TextureType = "face" | "ao" | "normal" | "disp";





// Интерфейс кэша текстур
export interface TerrainTextureCache {
  terrain: number;
  texture: Texture;
  aoTexture: Texture;
  dispTexture: Texture;
  normalTexture: Texture;
}

// Интерфейс кэша материалов
export interface TerrainMaterialCache {
  side: Side;
  terrain: number;
  material: MeshStandardMaterial;
}





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