// Перечисление типов геометрий травы для ячеек
export type CeilFenceWallGeometryType = false | "once" | "line" | "corner" | "tee" | "chair";

// Массив типов геометрий травы для ячеек
export const CeilFenceWallGeometry: CeilFenceWallGeometryType[] = [
  "once",
  "line",
  "corner",
  "tee",
  "chair",
];
