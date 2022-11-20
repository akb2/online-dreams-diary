import { CustomObjectKey } from "@_models/app";
import { ClosestHeights, DreamMap, DreamMapCeil, DreamMapSettings, XYCoord } from "@_models/dream-map";
import { DreamMapAlphaFogService } from "@_services/dream-map/alphaFog.service";
import { DreamMapPlantainGrassObject } from "@_services/dream-map/objects/grass/plantaingrass";
import { DreamMapWheatGrassObject } from "@_services/dream-map/objects/grass/wheatgrass";
import { DreamMapTreeObject } from "@_services/dream-map/objects/tree";
import { DreamMapObjectTemplate } from "@_services/dream-map/objects/_base";
import { BufferGeometry, Clock, Color, DataTexture, InstancedMesh, Material, Matrix4, Mesh } from "three";





// Интерфейс объекта карты
export interface DreamMapObject {
  id: number;
  name: string;
  catalog: number;
  controller: ObjectController;
  settings?: DreamMapObjectSettings;
}

// Параметры объекта
export interface DreamMapObjectSettings {
  rotation?: boolean;
  variants?: boolean;
  mixWithDefault?: boolean;
}

// Интерфейс категории объектов
export interface DreamMapObjectCatalog {
  id: number;
  name: string;
}

// Интерфейс данных объекта
export interface ObjectSetting {
  coords: XYCoord;
  mesh: InstancedMesh;
  type: string;
  subType: string;
  indexKeys: number[];
  count: number;
}

// Тип ответа
export interface MapObject {
  matrix: Matrix4[];
  color: Color[];
  geometry: BufferGeometry;
  material: Material;
  type: string;
  subType: string;
  coords: XYCoord;
  count: number;
  castShadow: boolean;
  recieveShadow: boolean;
  animate?: Function;
};





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
    dreamMapSettings: DreamMapSettings,
  ): DreamMapObjectTemplate
};

// Параметры контроллера
export type ObjectControllerParams = [
  DreamMap,
  DreamMapCeil,
  Mesh,
  Clock,
  DreamMapAlphaFogService,
  DataTexture,
  ClosestHeights,
  DreamMapSettings
];





// Список ландшафтов с объектами для пустых ячеек
export const ObjectControllers: CustomObjectKey<number, ObjectController[]> = {
  1: [DreamMapWheatGrassObject, DreamMapPlantainGrassObject],
};

// Список ландшафтов с объектами для пустых ячеек
export const ObjectStaticSubTypeControllers: CustomObjectKey<number, CustomObjectKey<string, Function>> = {
  1: {
    wheatgrass: DreamMapWheatGrassObject.getSubType,
    plantaingrass: DreamMapPlantainGrassObject.getSubType
  },
};

// Список категорий объектов
export const DreamMapObjectCatalogs: DreamMapObjectCatalog[] = [
  // Растения
  {
    id: 1,
    name: "Растительность"
  }
];

// Список объектов
export const DreamMapObjects: DreamMapObject[] = [
  // Дуб
  {
    id: 1,
    name: "Дуб",
    catalog: 1,
    controller: DreamMapTreeObject,
    settings: {
      mixWithDefault: true
    }
  }
].map((data: DreamMapObject) => ({
  ...data,
  settings: {
    rotation: !!data?.settings?.rotation,
    variants: !!data?.settings?.variants,
    mixWithDefault: !!data?.settings?.mixWithDefault
  }
}));
