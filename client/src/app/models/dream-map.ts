import { CustomObjectKey } from "@_models/app";
import { Place } from "@_models/dream";
import { ImageExtension } from "@_models/screen";
import { MeshStandardMaterial, Side, Texture } from "three";





// Интерфейс карты
export interface DreamMap {
  ceils: (DreamMapCeil | null)[];
  camera: DreamMapCameraPosition;
  size: MapSize;
  dreamerWay: DreamerWay[] | null;
  ocean: Water;
  land: WorldLand;
  sky: MapSkyData;
}

// Интерфейс настроек неба
export interface MapSkyData {
  time: number;
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
}

// Интерфейс типа местности
export interface MapTerrain {
  id: number;
  name: string;
  title: string;
  isAvail: boolean;
  splatMap: MapTerrainSplatMapSetting;
  exts: {
    face: ImageExtension;
    ao: ImageExtension;
    disp: ImageExtension;
    normal: ImageExtension;
  };
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
  Empty
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
  ocean: WaterDto;
  land: WorldLandDto;
  sky: MapSkyData
}

// Интерфейс ячейки сновидения
export interface DreamMapCeilDto {
  place?: number | null;
  terrain?: number | null;
  object?: number | null;
  coord?: CoordDto;
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

// Интерфейс воды
export interface WorldLand {
  z: number;
  type: number;
}

// Интерфейс воды для сервера
export interface WorldLandDto {
  z: number | null;
  type: number | null;
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





// Путь к файлам текстур
export const BaseTexturePath: string = "assets/dream-map/terrain/";
export const TexturePaths: CustomObjectKey<TextureType, string> = {
  face: BaseTexturePath + "face/",
  ao: BaseTexturePath + "ao/",
  normal: BaseTexturePath + "normal/",
  disp: BaseTexturePath + "displacement/",
};

// Набор типов линий
export const WayLineTypes: WayLineType[] = [
  //
  {
    type: "solid",
    title: "Ходьба / езда",
    description: "Перемещение пешком, автомобиле, велосипеде и т.д."
  },
  //
  {
    type: "double",
    title: "Полет",
    description: "Персонаж летит сам, или на транспорте, или другом существе"
  },
  //
  {
    type: "dashed",
    title: "Плавание",
    description: "Персонаж плывет сам, или на транспорте, или на другом существе"
  },
  //
  {
    type: "dotted",
    title: "Телепортация",
    description: "Персонаж перемещается из одной точки в другую, минуя пространство"
  }
];

// Список цветов для
const Colors: MapTerrainSplatMapColor[] = [MapTerrainSplatMapColor.Red, MapTerrainSplatMapColor.Green, MapTerrainSplatMapColor.Blue];

// Список типов местности
export const MapTerrains: MapTerrain[] = [
  // Газон
  {
    id: 1,
    name: "grass",
    title: "Газон",
    exts: {
      face: ImageExtension.jpg,
      normal: ImageExtension.jpg,
    },
  },
  // Земля
  {
    id: 2,
    name: "dirt",
    title: "Земля",
    exts: {
      face: ImageExtension.jpg,
      normal: ImageExtension.jpg,
    },
  },
  // Камень
  {
    id: 3,
    name: "stone",
    title: "Камень",
    exts: {
      face: ImageExtension.jpg,
      normal: ImageExtension.jpg,
    },
  },
  // Песок
  {
    id: 4,
    name: "sand",
    title: "Песок",
    exts: {
      face: ImageExtension.jpg,
      normal: ImageExtension.jpg,
    },
  },
  // Снег
  {
    id: 5,
    name: "snow",
    title: "Снег",
    exts: {
      face: ImageExtension.jpg,
      normal: ImageExtension.jpg,
    },
  }
]
  // Преобразовать в тип
  .map(d => d as MapTerrain)
  // Дополнить модель данными по умолчанию
  .map((d, k, a) => {
    const layout: number = Math.floor(k / Colors.length);
    const colorIndex: number = k - (layout * Colors.length);
    // Вернуть модель
    return {
      ...d,
      isAvail: !!d?.isAvail || true,
      exts: {
        face: d?.exts?.face as ImageExtension ?? ImageExtension.png,
        disp: d?.exts?.disp as ImageExtension ?? ImageExtension.png,
        normal: d?.exts?.normal as ImageExtension ?? ImageExtension.png,
        ao: d?.exts?.ao as ImageExtension ?? ImageExtension.png
      },
      splatMap: {
        layout,
        color: Colors[colorIndex]
      }
    };
  });
