import { CoordDto } from "@_models/dream-map";
import { DreamCeilParts, DreamCeilSize, DreamMaxHeight } from "@_models/dream-map-settings";
import { Float32BufferAttribute, IUniform, Matrix4, MeshStandardMaterial, PlaneGeometry, Ray, Triangle, Vector3 } from "three";





// Базовые параметры
export interface BaseObjectControllerParams {
  triangle: Triangle;
  v1: Vector3;
  v2: Vector3;
  dir: Vector3;
  ray: Ray;
  intersect: Vector3;
}

// Объект параметров для функции определения положения объекта на координате Y
export interface GetHeightByTerrainObject extends BaseObjectControllerParams {
  terrainGeometry: PlaneGeometry;
  qualityHelper: number;
  hyp: number;
  triangle: Triangle;
  faces: Triangle[];
  cX: number;
  cY: number;
};

// Объект параметров для вершин и фрагментов рельефа
export interface CreateTerrainTrianglesObject {
  terrainGeometry: PlaneGeometry;
  oWidth: number;
  oHeight: number;
  widthCorrect: number;
  heightCorrect: number;
  borderOSize: number;
  quality: number;
  qualityHelper: number;
  wdth: number;
  vertexItterator: number[];
  vertexVector3: Vector3[];
  vertexes: Float32BufferAttribute;
  facesCount: number;
  facesCountItterator: number[];
  facesTriangle: Triangle[];
  vertex: Vector3[];
  faces: Triangle[];
  hyp: number;
  cX: number;
  cY: number;
}





// Тип диапазона цветов
export type ColorRange = [number, number, number, number, number, number];

// Униформы шейдера
export type ShaderUniforms = { [uniform: string]: IUniform<any> };





// Смещение по умолчанию
export const DefTranslate: CoordDto = { x: 0, y: 0, z: 0 };

// Значение точки максимального положения объектов на оси Y
export const MaxHeight: number = (DreamCeilSize / DreamCeilParts) * DreamMaxHeight;

// Сопоставление текстурных ключей материала к папкам
export const TextureKeys: [keyof MeshStandardMaterial, string][] = [
  ["map", "face"],
  ["aoMap", "ao"],
  ["lightMap", "light"],
  ["normalMap", "normal"],
  ["displacementMap", "displacement"]
];

// Матрица по умолчанию
export const DefaultMatrix: Matrix4 = new Matrix4();