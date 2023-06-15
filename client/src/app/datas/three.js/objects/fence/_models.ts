import { CustomObjectKey } from "@_models/app";
import { ClosestHeightName, ClosestHeights } from "@_models/dream-map";





// Порядок сортировки соседних ячеек
export const ClosestHeightNameSortOrder: ClosestHeightName[] = [
  "top",
  "topRight",
  "right",
  "bottomRight",
  "bottom",
  "bottomLeft",
  "left",
  "topLeft"
];

// Углы для поворота стен забора
export const AnglesA: CustomObjectKey<keyof ClosestHeights, number> = {
  top: 90,
  topRight: 45,
  right: 0,
  bottomRight: 315,
  bottom: 270,
  bottomLeft: 225,
  left: 180,
  topLeft: 135
};
