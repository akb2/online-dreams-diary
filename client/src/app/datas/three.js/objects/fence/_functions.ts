import { ClosestHeightNames } from "@_datas/dream-map";
import { ArraySome } from "@_helpers/objects";
import { ClosestHeights, DreamMapCeil } from "@_models/dream-map";
import { ClosestHeightNameSortOrder } from "./_models";





// Получить под типа забора
export const GetFenceSubType = (ceil: DreamMapCeil, neighboringCeils: ClosestHeights) => {
  const closestCeils = GetLikeNeighboringKeys(ceil, neighboringCeils);
  const subType: string = closestCeils
    .sort(({ neighboringName: keyA }, { neighboringName: keyB }) => {
      const sortA: number = ClosestHeightNameSortOrder.findIndex(index => index === keyA);
      const sortB: number = ClosestHeightNameSortOrder.findIndex(index => index === keyB);
      // Вернуть результат сортировки
      return sortA - sortB;
    })
    .map(({ neighboringName }) => neighboringName)
    .join("-");
  // Вернуть подтип из имен соседних ячеек
  return subType;
};

// Получить направления для соседних ячеек
export const GetFenceWallSettings = (ceil: DreamMapCeil, neighboringCeils: ClosestHeights) => GetLikeNeighboringKeys(ceil, neighboringCeils) ?? [];

// Получить количество стен у забора
export const GetFenceWallCount = (ceil: DreamMapCeil, neighboringCeils: ClosestHeights) => GetFenceWallSettings(ceil, neighboringCeils)?.length ?? 0;

// Получить список ключей соседних ячеек с травой
export const GetLikeNeighboringKeys = (ceil: DreamMapCeil, neighboringCeils: ClosestHeights) => ClosestHeightNames
  .map(item => ({ ...neighboringCeils[item], neighboringName: item }))
  .filter(({ object }) => !!object && object === ceil.object)
  .filter(({ neighboringName }, i, array) => {
    const hasTop: boolean = ArraySome(array, ({ neighboringName }) => neighboringName === "top");
    const hasRight: boolean = ArraySome(array, ({ neighboringName }) => neighboringName === "right");
    const hasBottom: boolean = ArraySome(array, ({ neighboringName }) => neighboringName === "bottom");
    const hasLeft: boolean = ArraySome(array, ({ neighboringName }) => neighboringName === "left");
    // Проверить соседние ячейки
    return (
      neighboringName === "top" ||
      neighboringName === "right" ||
      neighboringName === "bottom" ||
      neighboringName === "left" ||
      (neighboringName === "topRight" && !hasTop && !hasRight) ||
      (neighboringName === "bottomRight" && !hasBottom && !hasRight) ||
      (neighboringName === "bottomLeft" && !hasBottom && !hasLeft) ||
      (neighboringName === "topLeft" && !hasTop && !hasLeft)
    );
  });
