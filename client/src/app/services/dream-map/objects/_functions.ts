import { CoordDto } from "@_models/dream-map";
import { ObjectSetting } from "@_models/dream-map-objects";
import { DreamCeilParts, DreamCeilSize, DreamMaxHeight } from "@_models/dream-map-settings";
import { Matrix4, Ray, Triangle, Vector3 } from "three";





// Значение точки максимального положения объектов на оси Y
const MaxHeight: number = (DreamCeilSize / DreamCeilParts) * DreamMaxHeight;

// Объект параметров для функции определения положения объекта на координате Y
export interface GetHeightByTerrainObject {
  qualityHelper: number;
  hyp: number;
  v1: Vector3;
  v2: Vector3;
  dir: Vector3;
  ray: Ray;
  intersect: Vector3;
  triangle: Triangle;
  faces: Triangle[];
  cX: number;
  cY: number;
};

// Смещение по умолчанию
const DefTranslate: CoordDto = { x: 0, y: 0, z: 0 };





// Функция определения положения объекта на координате Y
export const GetHeightByTerrain: (params: GetHeightByTerrainObject, x: number, y: number) => number = (params: GetHeightByTerrainObject, x: number, y: number) => {
  const {
    qualityHelper,
    hyp,
    v1,
    v2,
    dir,
    ray,
    intersect,
    triangle,
    faces,
    cX,
    cY,
  }: GetHeightByTerrainObject = params;
  const step: number = DreamCeilSize;
  let lX: number = x - cX;
  let lY: number = y - cY;
  // Корректировка координат
  if (lX > step || lY > step || lX < 0 || lY < 0) {
    const xCorr: number = Math.floor(lX / step);
    const yCorr: number = Math.floor(lY / step);
    x = x + xCorr;
    y = y + yCorr;
    lX = lX - xCorr;
    lY = lY - yCorr;
  }
  // Параметры
  const xSeg: number = Math.floor(lX * qualityHelper);
  const ySeg: number = Math.floor(lY * qualityHelper);
  const locHyp: number = Math.sqrt(Math.pow((lX - (xSeg / qualityHelper)) + (lY - (ySeg / qualityHelper)), 2) * 2);
  const seg: number = locHyp >= hyp ? 1 : 0;
  const faceIndex: number = (((ySeg * qualityHelper) + xSeg) * 2) + seg;
  // Поиск координаты Z
  v1.set(x, y, 0);
  v2.set(x, y, MaxHeight);
  dir.subVectors(v2, v1).normalize();
  dir.normalize();
  ray.set(v1, dir);
  ray.intersectTriangle(faces[faceIndex].a, faces[faceIndex].b, faces[faceIndex].c, false, intersect);
  triangle.set(faces[faceIndex].a, faces[faceIndex].b, faces[faceIndex].c);
  // Координата Z
  return intersect.z;
};

// Функция обновлеия высоты
export const UpdateHeight = (objectSetting: ObjectSetting, params: GetHeightByTerrainObject) => {
  if (objectSetting.count > 0) {
    const matrix: Matrix4 = new Matrix4();
    const position: Vector3 = new Vector3();
    // Цикл по фрагментам
    objectSetting.indexKeys.forEach((index, i) => {
      objectSetting.mesh.getMatrixAt(index, matrix);
      position.setFromMatrixPosition(matrix);
      // Координаты
      const translate: CoordDto = objectSetting?.translates?.length > i ? objectSetting.translates[i] ?? DefTranslate : DefTranslate;
      const x: number = position.x - translate.x;
      const z: number = position.z - translate.z;
      const y: number = GetHeightByTerrain(params, x, z);
      // Запомнить позицию
      matrix.setPosition(x + translate.x, y + translate.y, z + translate.z);
      objectSetting.mesh.setMatrixAt(index, matrix);
    });
    // Обновить
    objectSetting.mesh.updateMatrix();
    objectSetting.mesh.instanceMatrix.needsUpdate = true;
  }
}
