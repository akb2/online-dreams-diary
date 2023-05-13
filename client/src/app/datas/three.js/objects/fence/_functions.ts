import { ArrayFilter, ArrayMap } from "@_helpers/objects";
import { ClosestHeights, DreamMapCeil } from "@_models/dream-map";
import { ClosestKeysAll } from "../_models";





// Получить под типа забора
export const GetFenceSubType = (ceil: DreamMapCeil, neighboringCeils: ClosestHeights) => {
  const closestCeils = GetLikeNeighboringKeys(ceil, neighboringCeils);
  const closestCount: number = closestCeils.length;
  // Отрисовка только для существующих типов фигур
  if (closestCount < 4) {
    // Для ячеек без похожих соседних ячеек
    if (closestCount === 0) {
      return "none";
    }
    // Для ячеек с одной похожей геометрией
    else if (closestCount === 1) {
      return "once";
    }
    // Для ячеек с двумя похожими геометриями
    else if (closestCount === 2) {
      const isLine: boolean = (
        closestCeils.every(({ neighboringName }) => neighboringName === "top" || neighboringName === "bottom") ||
        closestCeils.every(({ neighboringName }) => neighboringName === "left" || neighboringName === "right")
      );
      // Линия или угол
      return isLine ? "line" : "corner";
    }
    // Для ячеек с тремя похожими геометриями
    else if (closestCount === 3) {
      return "tee";
    }
  }
  // Полная геометрия
  return "chair";
};

// Получить направления для соседних ячеек
export const GetFenceWallSettings = (ceil: DreamMapCeil, neighboringCeils: ClosestHeights) => GetLikeNeighboringKeys(ceil, neighboringCeils) ?? [];

// Получить количество стен у забора
export const GetFenceWallCount = (ceil: DreamMapCeil, neighboringCeils: ClosestHeights) => GetFenceWallSettings(ceil, neighboringCeils)?.length ?? 0;

// Получить список ключей соседних ячеек с травой
export const GetLikeNeighboringKeys = (ceil: DreamMapCeil, neighboringCeils: ClosestHeights) => ArrayFilter(
  ArrayMap(ClosestKeysAll, item => ({ ...neighboringCeils[item], neighboringName: item })),
  ({ object }) => !!object && object === ceil.object
);
