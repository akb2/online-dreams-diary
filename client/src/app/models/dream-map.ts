import { CustomObjectKey } from "@_models/app";
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
  ocean: Water;
  land: WorldLand;
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
  settings: MapTerrainSettings;
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
  fogDistance: number;
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
    bias: number;
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
  ocean: WaterDto;
  land: WorldLandDto;
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
const BaseTexturePath: string = "assets/dream-map/terrain/top/";
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

// Список типов местности
export const MapTerrains: MapTerrain[] = [
  // Газон
  {
    id: 1,
    name: "grass",
    title: "Газон",
    settings: {
      colorR: 115,
      colorG: 201,
      colorB: 44,
      metalness: 0,
      roughness: 0.76,
      aoMapIntensity: 2.5,
      normalScale: -0.2
    }
  },
  // Земля
  {
    id: 2,
    name: "dirt",
    title: "Земля",
    settings: {
      colorR: 135,
      colorG: 163,
      colorB: 158,
      metalness: 0.1,
      roughness: 0.85,
      aoMapIntensity: 5.5,
      normalScale: -0.2
    }
  },
  // Камень
  {
    id: 3,
    name: "stone",
    title: "Камень",
    settings: {
      colorR: 180,
      colorG: 180,
      colorB: 180,
      metalness: 0.75,
      roughness: 0.75,
      aoMapIntensity: 2.5,
      normalScale: -0.7
    }
  },
  // Песок
  {
    id: 4,
    name: "sand",
    title: "Песок",
    settings: {
      colorR: 170,
      colorG: 170,
      colorB: 170,
      metalness: 0.1,
      roughness: 0.6,
      aoMapIntensity: 3.5,
      normalScale: -0.5
    }
  },
  // Снег
  {
    id: 5,
    name: "snow",
    title: "Снег",
    settings: {
      colorR: 230,
      colorG: 230,
      colorB: 230,
      metalness: 0,
      roughness: 0.4,
      aoMapIntensity: 0.5,
      normalScale: 0.1
    }
  }
]
  .map(d => d as MapTerrain)
  .map((d, k, a) => ({
    ...d,
    isAvail: !!d?.isAvail || true,
    exts: {
      face: d?.exts?.face as ImageExtension ?? ImageExtension.png,
      disp: d?.exts?.disp as ImageExtension ?? ImageExtension.png,
      normal: d?.exts?.normal as ImageExtension ?? ImageExtension.png,
      ao: d?.exts?.ao as ImageExtension ?? ImageExtension.png
    },
    settings: {
      colorR: d?.settings?.colorR === undefined ? 100 : d.settings.colorR,
      colorG: d?.settings?.colorG === undefined ? 100 : d.settings.colorG,
      colorB: d?.settings?.colorB === undefined ? 100 : d.settings.colorB,
      metalness: d?.settings?.metalness === undefined ? 0.5 : d.settings.metalness,
      roughness: d?.settings?.roughness === undefined ? 0 : d.settings.roughness,
      aoMapIntensity: d?.settings?.aoMapIntensity === undefined ? 1 : d.settings.aoMapIntensity,
      displacementScale: d?.settings?.displacementScale === undefined ? 0 : d.settings.displacementScale,
      envMapIntensity: d?.settings?.envMapIntensity === undefined ? 1 : d.settings.envMapIntensity,
      normalScale: d?.settings?.normalScale === undefined ? 0 : d.settings.normalScale,
    }
  }))
  .map((d, k) => {
    const layout: number = Math.floor(k / 3);
    const colorIndex: number = k - (layout * 3);
    const colors: MapTerrainSplatMapColor[] = [MapTerrainSplatMapColor.Red, MapTerrainSplatMapColor.Green, MapTerrainSplatMapColor.Blue];
    // Вернуть массив
    return {
      ...d,
      splatMap: {
        layout,
        color: colors[colorIndex]
      }
    };
  });
