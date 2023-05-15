import { DreamMapObjectTemplate } from "@_datas/three.js/objects/_base";
import { CustomObjectKey, IconType } from "@_models/app";
import { ClosestHeights, CoordDto, DreamMap, DreamMapCeil, DreamMapSettings, XYCoord } from "@_models/dream-map";
import { BufferGeometry, Clock, Color, DataTexture, Material, Matrix4, Mesh, Vector3 } from "three";
import { ShearableInstancedMesh } from "./three.js/shearable-instanced-mesh";





// Интерфейс объекта карты
export interface DreamMapObject {
  id: number;
  type: DreamMapObjectType;
  sortIndex: number;
  name: string;
  icon?: string;
  iconType?: IconType;
  image?: string;
  catalog: number;
  controllers: ObjectController[];
  subTypeFunctions: CustomObjectKey<string, Function>;
  settings?: DreamMapObjectSettings;
}

// Интерфейс группы объектов
export interface DreamMapGroupObject {
  id: number;
  ids: number[];
  type: DreamMapGroupObjectType;
  sortIndex: number;
  name: string;
  icon?: string;
  image?: string;
  catalog: number;
  settings?: DreamMapObjectSettings;
}

// Тип смеси объектов с группами объектов
export type DreamMapMixedObject = DreamMapObject | DreamMapGroupObject;

// Типы объектов
export type DreamMapObjectType = "object";
export type DreamMapGroupObjectType = "group";

// Параметры объекта
export interface DreamMapObjectSettings {
  rotation?: boolean;
  variants?: boolean;
  mixWithDefault?: boolean;
  multiCeils?: boolean;
}

// Интерфейс категории объектов
export interface DreamMapObjectCatalog {
  id: number;
  icon: string;
  iconType: IconType;
  name: string;
}

// Интерфейс данных объекта
export interface ObjectSetting {
  coords: XYCoord;
  mesh: ShearableInstancedMesh;
  type: string;
  subType: string;
  splitBySubType: boolean;
  indexKeys: number[];
  count: number;
  isDefault: boolean;
  translates?: CoordDto[];
  moreClosestsUpdate: boolean;
}

// Тип ответа
export interface MapObject {
  matrix: Matrix4[];
  color: Color[];
  skews: Vector3[];
  lodDistances: number[];
  geometry: BufferGeometry;
  material: Material;
  type: string;
  subType: string;
  splitBySubType: boolean;
  coords: XYCoord;
  count: number;
  castShadow: boolean;
  recieveShadow: boolean;
  isDefault: boolean;
  translates?: CoordDto[];
  animate?: () => void;
  raycastBox?: boolean;
  moreClosestsUpdate?: boolean;
  noize?: number;
};

// Тип ответа
export class MapObjectRaycastBoxData {
  constructor(
    public minX: number = Infinity,
    public maxX: number = -Infinity,
    public minY: number = Infinity,
    public maxY: number = -Infinity,
    public minZ: number = Infinity,
    public maxZ: number = -Infinity
  ) { }
};





// Тип контроллера объектов
export type ObjectController = {
  new(
    dreamMap: DreamMap,
    ceil: DreamMapCeil,
    terrain: Mesh,
    clock: Clock,
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
  DataTexture,
  ClosestHeights,
  DreamMapSettings
];
