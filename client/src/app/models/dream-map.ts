import { DreamObjectElmsValues } from "@_datas/dream-map-settings";
import { CustomObjectKey } from "@_models/app";
import { Place } from "@_models/dream";
import { MeshStandardMaterial, Side, Texture } from "three";
import { ScrollAddDimension } from "./screen";





// Интерфейс карты
export interface DreamMap {
  ceils: (DreamMapCeil)[];
  camera: DreamMapCameraPosition;
  size: MapSize;
  dreamerWay: DreamerWay[];
  ocean: Water;
  land: WorldLand;
  sky: MapSkyData;
  relief: DreamMapReliefSettings;
  isNew: boolean;
}

// Интерфейс настроек неба
export interface MapSkyData {
  time: number;
}

// Интерфейс данных позиции камеры
export interface DreamMapCameraPosition {
  target: CoordDto;
  position: CoordDto;
}

// Интерфейс ячейки сновидения
export interface DreamMapCeil {
  place: Place;
  terrain: number;
  object: number;
  highlight?: boolean;
  waterHightlight?: number;
  coord: Coord;
}

// Интерфейс типа местности
export interface MapTerrain {
  id: number;
  name: string;
  title: string;
  isAvail: boolean;
  splatMap: MapTerrainSplatMapSetting;
  tileCoords: XYCoord;
}

// Тип рельефов
export enum ReliefType {
  flat = "flat",
  hill = "hill",
  mountain = "mountain",
  canyon = "canyon",
  pit = "pit",
}

// Интерфейс настроек для цветовой маски
export interface MapTerrainSplatMapSetting {
  layout: number;
  color: MapTerrainSplatMapColor;
}

// Перечисление цветов для цветовой маски
export enum MapTerrainSplatMapColor {
  Red,
  Green,
  Blue,
  Alpha,
  Empty
}

// Интерфейс карты для сервера
export interface DreamMapDto {
  ceils: (DreamMapCeilDto)[];
  camera?: DreamMapCameraPosition;
  size: MapSize;
  dreamerWay: DreamerWay[];
  ocean: WaterDto;
  sky: MapSkyData;
  relief?: DreamMapReliefSettings;
}

// Интерфейс ячейки сновидения
export interface DreamMapCeilDto {
  place?: number;
  terrain?: number;
  object?: number;
  coord?: CoordDto;
}

// Интерфейс соседних блоков
export type ClosestHeights = CustomObjectKey<ClosestHeightName, ClosestHeight>;

// Интерфейс для соседних блоков
export interface ClosestHeight {
  height: number;
  terrain: number;
  object: number;
  coords: Coord;
}

// Имена соседних ячеек
export type ClosestHeightName = ScrollAddDimension | "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

// Имена всех секторов карты
export type DreamMapSector = ClosestHeightName | "center";





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
export interface XYCoord<T = number> {
  x: T;
  y: T;
}

// Интерфейс 2D координат на окружности
export interface UVCoord<T = number> {
  u: T;
  v: T;
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
  material: number;
}

// Интерфейс воды для сервера
export interface WaterDto {
  z: number;
  material: number;
}

// Интерфейс воды
export interface WorldLand {
  z: number;
  type: number;
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
export type BaseTextureType = "face" | "ao" | "normal" | "disp" | "roughness" | "metalness";

// Типы текстур + иконка
export type TextureType = BaseTextureType | "icons";

// Настройки карты за пределами
export interface DreamMapReliefSettings {
  types: CustomObjectKey<keyof ClosestHeights, ReliefType>;
}

// Настройки редактора
export interface DreamMapSettings {
  detalization: DreamObjectElmsValues;
  shadowQuality: number;
}





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
