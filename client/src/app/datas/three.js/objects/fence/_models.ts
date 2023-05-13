import { CustomObjectKey } from "@_models/app";
import { ClosestHeights } from "@_models/dream-map";





// Перечисление типов геометрий травы для ячеек
export type CeilFenceWallGeometryType = "none" | "once" | "line" | "corner" | "tee" | "chair";

// Массив типов геометрий травы для ячеек
export const CeilFenceWallGeometry: CeilFenceWallGeometryType[] = [
  "none",
  "once",
  "line",
  "corner",
  "tee",
  "chair",
];

// Углы для поворота стен забора
export const AnglesA: CustomObjectKey<keyof ClosestHeights, number> = { top: 90, right: 0, bottom: 270, left: 180 };
