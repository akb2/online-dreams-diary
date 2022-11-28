import { CustomObjectKey } from "@_models/app";
import { ClosestHeights, XYCoord } from "@_models/dream-map";
import { ColorRange } from "@_services/dream-map/objects/_models";
import { DoubleSide, MeshPhongMaterial } from "three";






export const TriangleUVA: XYCoord = { x: 0, y: 0 };
export const TriangleUVB: XYCoord = { x: 1, y: 0 };
export const TriangleUVC: XYCoord = { x: 0, y: 1 };
export const TriangleUVD: XYCoord = { x: 1, y: 1 };
export const TrianglesCoords: CustomObjectKey<number, XYCoord[]> = {
  0: [TriangleUVA, TriangleUVB, TriangleUVC],
  90: [TriangleUVA, TriangleUVB, TriangleUVD],
  180: [TriangleUVA, TriangleUVC, TriangleUVD],
  270: [TriangleUVB, TriangleUVC, TriangleUVD]
};

export const RandomFactor: number = 3;
export const BordersX: CustomObjectKey<number, number[]> = { 0: [-0.5, 0], 180: [0, 0.5] };
export const BordersY: CustomObjectKey<number, number[]> = { 90: [-0.5, 0], 270: [0, 0.5] };

// Перечисление типов геометрий травы для ячеек
export type CeilGrassFillGeometryType = "circle" | "half-circle" | "triangle" | false;

// Массив типов геометрий травы для ячеек
export const CeilGrassFillGeometry: CeilGrassFillGeometryType[] = [
  "circle",
  "half-circle",
  "triangle",
];

// Список анализируемых соседних ячеек
export const ClosestKeysAll: (keyof ClosestHeights)[] = ["top", "right", "bottom", "left"];

// Углы
export const AnglesA: CustomObjectKey<keyof ClosestHeights, number> = { top: 90, right: 180, bottom: 270, left: 0 };
export const AnglesB: CustomObjectKey<keyof ClosestHeights, CustomObjectKey<keyof ClosestHeights, number>> = {
  top: { left: 0, right: 90 },
  left: { top: 0, bottom: 180 },
  right: { top: 90, bottom: 270 },
  bottom: { left: 180, right: 270 },
};
export const AllCorners: CustomObjectKey<keyof ClosestHeights, CustomObjectKey<keyof ClosestHeights, (keyof ClosestHeights)[]>> = {
  top: { left: ["topRight", "bottomLeft"], right: ["topLeft", "bottomRight"] },
  left: { top: ["topRight", "bottomLeft"], bottom: ["topLeft", "bottomRight"] },
  right: { top: ["topLeft", "bottomRight"], bottom: ["topRight", "bottomLeft"] },
  bottom: { left: ["topLeft", "bottomRight"], right: ["topRight", "bottomLeft"] },
};

// Материал
export const GrassMaterial: MeshPhongMaterial = new MeshPhongMaterial({
  fog: true,
  transparent: false,
  side: DoubleSide,
  flatShading: true
});

// Предел цветов
export const GrassColorRange: ColorRange = [0, 0.3, 0.7, 1, 0, 0.3];
