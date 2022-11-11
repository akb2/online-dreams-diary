import { CustomObjectKey } from "@_models/app";
import { Place } from "@_models/dream";
import { ImageExtension } from "@_models/screen";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
import { DreamMapGrassObject } from "@_services/dream-map/objects/grass";
import { DreamMapObjectTemplate } from "@_services/dream-map/objects/_base";
import { Clock, DataTexture, Mesh, MeshStandardMaterial, Side, Texture } from "three";





// Интерфейс карты
export interface DreamMap {
  ceils: (DreamMapCeil | null)[];
  camera: DreamMapCameraPosition;
  size: MapSize;
  dreamerWay: DreamerWay[] | null;
  ocean: Water;
  land: WorldLand;
  sky: MapSkyData;
  relief: DreamMapReliefSettings;
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
  place: Place | null;
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
  exts: {
    face: ImageExtension;
    ao: ImageExtension;
    disp: ImageExtension;
    normal: ImageExtension;
  };
}

// Тип рельефов
export enum ReliefType {
  flat = "flat",
  hill = "hill",
  mountain = "mountain",
  canyon = "canyon",
  pit = "pit",
}

// Интерфейс объекта карты
export interface MapObject {
  id: number;
  type: string;
  subType: string;
  controller: ObjectController;
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

// Интерфейс карты для сервера
export interface DreamMapDto {
  ceils: (DreamMapCeilDto | null)[];
  camera?: DreamMapCameraPosition;
  size: MapSize;
  dreamerWay: DreamerWay[] | null;
  ocean: WaterDto;
  sky: MapSkyData;
  relief?: DreamMapReliefSettings;
}

// Интерфейс ячейки сновидения
export interface DreamMapCeilDto {
  place?: number | null;
  terrain?: number | null;
  object?: number | null;
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
export type ClosestHeightName = "topLeft" | "top" | "topRight" | "left" | "right" | "bottomLeft" | "bottom" | "bottomRight";





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
  material: number;
}

// Интерфейс воды для сервера
export interface WaterDto {
  z: number | null;
  material: number | null;
}

// Интерфейс воды
export interface WorldLand {
  z: number;
  type: number;
}

// Типы цветов пути
export type WayColor = "red" | "green" | "blue" | "white" | "black" | "gray" | "orange" | "pink" | "pink" | "purple";

// Тип контроллера объектов
export type ObjectController = {
  new(
    dreamMap: DreamMap,
    ceil: DreamMapCeil,
    terrain: Mesh,
    clock: Clock,
    alphaFogService: DreamMapAlphaFogService,
    displacementTexture: DataTexture,
    neighboringCeils: ClosestHeights,
  ): DreamMapObjectTemplate
};

// Параметры контроллера
export type ObjectControllerParams = [DreamMap, DreamMapCeil, Mesh, Clock, DreamMapAlphaFogService, DataTexture, ClosestHeights];

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

// Настройки карты за пределами
export interface DreamMapReliefSettings {
  rewrite: boolean;
  types: CustomObjectKey<keyof ClosestHeights, ReliefType>;
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





// Путь к файлам текстур местости
export const BaseTexturePath: string = "assets/dream-map/terrain/";
export const TexturePaths: CustomObjectKey<TextureType, string> = {
  face: BaseTexturePath + "face/",
  normal: BaseTexturePath + "normal/",
};

const BaseobjectTexturePath: string = "assets/dream-map/object/";
export const ObjectTexturePaths: (name: string, type: TextureType) => string = (name: string, type: TextureType) => {
  const paths: CustomObjectKey<TextureType, string> = {
    face: BaseobjectTexturePath + name + "/face/",
    normal: BaseobjectTexturePath + name + "/normal/",
  };
  // Вернуть путь
  return paths[type];
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

// Список ландшафтов с объектами для непустых ячеек
export const ObjectControllers: CustomObjectKey<number, ObjectController> = {
  1: DreamMapGrassObject,
};

// Список ландшафтов с объектами для непустых ячеек
export const ObjectStaticSubTypeControllers: CustomObjectKey<number, Function> = {
  1: DreamMapGrassObject.getSubType,
};
