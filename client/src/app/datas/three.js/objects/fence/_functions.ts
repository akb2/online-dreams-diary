import { ClosestHeight, ClosestHeights, DreamMapCeil } from "@_models/dream-map";
import { GetDreamMapObjectByID } from "../_functions";
import { ClosestKeysAll } from "../_models";
import { CeilFenceWallGeometry } from "./_models";





// Получить под типа травы
// export const GetGrassSubType = (ceil: DreamMapCeil, neighboringCeils: ClosestHeights) => {
//   const closestKeys: (keyof ClosestHeights)[] = GetLikeNeighboringKeys(ceil, neighboringCeils);
//   const closestCeils: ClosestHeight[] = closestKeys.map(k => neighboringCeils[k]);
//   const closestCount: number = closestCeils.length;
//   // Отрисовка только для существующих типов фигур
//   if (closestCount < CeilFenceWallGeometry.length && !!CeilFenceWallGeometry[closestCount]) {
//     // Для ячеек без похожих соседних ячеек
//     if (closestCount === 0) {
//       return "circle";
//     }
//     // Для ячеек с одной похожей геометрией
//     else if (closestCount === 1) {
//       return "half-circle";
//     }
//     // Для ячеек с двумя похожими геометриями
//     else if (closestCount === 2) {
//       const angle: number = AnglesB[closestKeys[0]][closestKeys[1]] ?? -1;
//       // Обрабатывать только те ячейки где одинаковые соседние типы местности в разных координатах
//       if (angle >= 0) {
//         const corners: (keyof ClosestHeights)[] = AllCorners[closestKeys[0]][closestKeys[1]];
//         const cornersCount: number = corners.map(k => neighboringCeils[k]).filter(c => c.terrain === ceil.terrain).length;
//         // Посчитать
//         return cornersCount > 0 ? "triangle" : "quarter-ceil";
//       }
//     }
//   }
//   // Полная геометрия
//   return "square";
// };

// Получить список ключей соседних ячеек с травой
export const GetLikeNeighboringKeys = (ceil: DreamMapCeil, neighboringCeils: ClosestHeights) => ClosestKeysAll.filter(k => {
  const c: ClosestHeight = neighboringCeils[k];
  // Вернуть результат проверки
  return !!c.object && c.object === ceil.object;
});
