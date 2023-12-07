import { MapObjectRaycastBoxData } from "@_models/dream-map-objects";
import { Box3, BufferAttribute, BufferGeometry, InstancedMesh, Matrix4 } from "three";
import { MathRound } from "./math";
import { ForCycle } from "./objects";





// Получить массив вершин из геометрии
const GetVerticesByGeometry = (geometry: BufferGeometry): ArrayLike<number> => (geometry.getAttribute("position") as BufferAttribute).array;

// Максимальное значение по оси X
export const GetGeometryMaxX = (geometry: BufferGeometry): number => {
  const vertices = GetVerticesByGeometry(geometry);
  let maxX: number = -Infinity;
  // Найдите максимальное значение X
  ForCycle(MathRound(vertices.length / 3), index => maxX = vertices[index * 3] > maxX ? vertices[index * 3] : maxX, true);
  // Вернуть высоту
  return maxX;
};

// Минимальное значение по оси X
export const GetGeometryMinX = (geometry: BufferGeometry): number => {
  const vertices = GetVerticesByGeometry(geometry);
  let minX: number = Infinity;
  // Найдите максимальное значение X
  ForCycle(MathRound(vertices.length / 3), index => minX = vertices[index * 3] < minX ? vertices[index * 3] : minX, true);
  // Вернуть высоту
  return minX;
};

// Максимальное значение по оси Y
export const GetGeometryMaxY = (geometry: BufferGeometry): number => {
  const vertices = GetVerticesByGeometry(geometry);
  let maxY: number = -Infinity;
  // Найдите максимальное значение Y
  ForCycle(MathRound(vertices.length / 3), index => maxY = vertices[(index * 3) + 1] > maxY ? vertices[(index * 3) + 1] : maxY, true);
  // Вернуть высоту
  return maxY;
};

// Минимальное значение по оси Y
export const GetGeometryMinY = (geometry: BufferGeometry): number => {
  const vertices = GetVerticesByGeometry(geometry);
  let minY: number = Infinity;
  // Найдите максимальное значение Y
  ForCycle(MathRound(vertices.length / 3), index => minY = vertices[(index * 3) + 1] < minY ? vertices[(index * 3) + 1] : minY, true);
  // Вернуть высоту
  return minY;
};

// Максимальное значение по оси Z
export const GetGeometryMaxZ = (geometry: BufferGeometry): number => {
  const vertices: ArrayLike<number> = (geometry.getAttribute("position") as BufferAttribute).array;
  let maxZ: number = -Infinity;
  // Найдите максимальное значение Z
  ForCycle(MathRound(vertices.length / 3), index => maxZ = vertices[(index * 3) + 2] > maxZ ? vertices[(index * 3) + 2] : maxZ, true);
  // Вернуть высоту
  return maxZ;
};

// Минимальное значение по оси Z
export const GetGeometryMinZ = (geometry: BufferGeometry): number => {
  const vertices = GetVerticesByGeometry(geometry);
  let minZ: number = Infinity;
  // Найдите максимальное значение Z
  ForCycle(MathRound(vertices.length / 3), index => minZ = vertices[(index * 3) + 2] < minZ ? vertices[(index * 3) + 2] : minZ, true);
  // Вернуть высоту
  return minZ;
};

// Получить список предельных координат геометрии
export const GetMapObjectRaycastBoxData = (geometry?: BufferGeometry, data: MapObjectRaycastBoxData = null, offsetData: MapObjectRaycastBoxData = null) => {
  data = data ?? new MapObjectRaycastBoxData();
  offsetData = offsetData ?? new MapObjectRaycastBoxData(0, 0, 0, 0, 0, 0);
  // Поиск в геометрии
  if (!!geometry) {
    data.minX = offsetData.minX + Math.min(data.minX, GetGeometryMinX(geometry));
    data.maxX = offsetData.maxX + Math.max(data.maxX, GetGeometryMaxX(geometry));
    data.minY = offsetData.minY + Math.min(data.minY, GetGeometryMinY(geometry));
    data.maxY = offsetData.maxY + Math.max(data.maxY, GetGeometryMaxY(geometry));
    data.minZ = offsetData.minZ + Math.min(data.minZ, GetGeometryMinZ(geometry));
    data.maxZ = offsetData.maxZ + Math.max(data.maxZ, GetGeometryMaxZ(geometry));
  }
  // Вернуть данные
  return { ...data };
};





// Предельные координаты InstancedMesh
export const GetInstanceBoundingBox = (instancedMesh: InstancedMesh, index: number, data: MapObjectRaycastBoxData = null) => {
  const matrix = new Matrix4();
  // Применение матрицы
  data = data ?? new MapObjectRaycastBoxData();
  instancedMesh.getMatrixAt(index, matrix);
  // Поиск параметров
  const originalBoundingBox = new Box3().setFromBufferAttribute(instancedMesh.geometry.attributes.position as BufferAttribute);
  const transformedBoundingBox = originalBoundingBox.clone().applyMatrix4(matrix);
  const min = transformedBoundingBox.min;
  const max = transformedBoundingBox.max;
  // Обновить паарметры
  data.minX = Math.min(data.minX, min.x);
  data.maxX = Math.max(data.maxX, max.x);
  data.minY = Math.min(data.minY, min.y);
  data.maxY = Math.max(data.maxY, max.y);
  data.minZ = Math.min(data.minZ, min.z);
  data.maxZ = Math.max(data.maxZ, max.z);
  // Вернуть координаты
  return { ...data };
}
