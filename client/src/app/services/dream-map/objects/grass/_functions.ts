import { ClosestHeight, ClosestHeights, DreamMapCeil, XYCoord } from "@_models/dream-map";
import { DreamMapObjects } from "@_datas/dream-map-objects";
import { DreamCeilSize } from "@_models/dream-map-settings";
import { MathRound, Random, TriangleSquare } from "@_helpers/math";
import { AllCorners, AnglesA, AnglesB, BordersX, BordersY, CeilGrassFillGeometry, ClosestKeysAll, RandomFactor, TrianglesCoords } from "@_services/dream-map/objects/grass/_models";





// Получить под типа травы
export const GetGrassSubType = (ceil: DreamMapCeil, neighboringCeils: ClosestHeights) => {
  const closestKeys: (keyof ClosestHeights)[] = GetLikeNeighboringKeys(ceil, neighboringCeils);
  const closestCeils: ClosestHeight[] = closestKeys.map(k => neighboringCeils[k]);
  const closestCount: number = closestCeils.length;
  // Отрисовка только для существующих типов фигур
  if (closestCount < CeilGrassFillGeometry.length && !!CeilGrassFillGeometry[closestCount]) {
    // Для ячеек без похожих соседних ячеек
    if (closestCount === 0) {
      return "circle";
    }
    // Для ячеек с одной похожей геометрией
    else if (closestCount === 1) {
      return "half-circle";
    }
    // Для ячеек с двумя похожими геометриями
    else if (closestCount === 2) {
      const angle: number = AnglesB[closestKeys[0]][closestKeys[1]] ?? -1;
      // Обрабатывать только те ячейки где одинаковые соседние типы местности в разных координатах
      if (angle >= 0) {
        const corners: (keyof ClosestHeights)[] = AllCorners[closestKeys[0]][closestKeys[1]];
        const cornersCount: number = corners.map(k => neighboringCeils[k]).filter(c => c.terrain === ceil.terrain).length;
        // Посчитать
        return cornersCount > 0 ? "triangle" : "quarter-ceil";
      }
    }
  }
  // Полная геометрия
  return "square";
};

// Получить список ключей соседних ячеек с травой
export const GetLikeNeighboringKeys = (ceil: DreamMapCeil, neighboringCeils: ClosestHeights) => ClosestKeysAll.filter(k => {
  const c: ClosestHeight = neighboringCeils[k];
  const objectData = DreamMapObjects.find(({ id }) => id === c.object);
  // Вернуть результат проверки
  return c.terrain === ceil.terrain && (!!objectData?.settings?.mixWithDefault || !c.object);
});

// Проверка вписания травы в плавную фигуру с учетом соседних ячеек
export const CheckCeilForm = (cX: number, cY: number, x: number, y: number, neighboringCeils: ClosestHeights, ceil: DreamMapCeil): boolean => {
  const randomCheck: boolean = Random(1, 100) <= RandomFactor;
  // Проверка соседних ячеек, если не фактор случайности не сработал
  if (!randomCheck) {
    const closestKeys: (keyof ClosestHeights)[] = GetLikeNeighboringKeys(ceil, neighboringCeils);
    const closestCeils: ClosestHeight[] = closestKeys.map(k => neighboringCeils[k]);
    const closestCount: number = closestCeils.length;
    // Отрисовка только для существующих типов фигур
    if (closestCount < CeilGrassFillGeometry.length && !!CeilGrassFillGeometry[closestCount]) {
      // Для ячеек без похожих соседних ячеек
      if (closestCount === 0) {
        return CheckCeilCircleForm(cX, cY, x, y);
      }
      // Для ячеек с одной похожей геометрией
      else if (closestCount === 1) {
        const angle: number = AnglesA[closestKeys[0]];
        // Тест геометрии
        return CheckCeilHalfCircleForm(cX, cY, x, y, angle);
      }
      // Для ячеек с двумя похожими геометриями
      else if (closestCount === 2) {
        const angle: number = AnglesB[closestKeys[0]][closestKeys[1]] ?? -1;
        // Обрабатывать только те ячейки где одинаковые соседние типы местности в разных координатах
        if (angle >= 0) {
          const corners: (keyof ClosestHeights)[] = AllCorners[closestKeys[0]][closestKeys[1]];
          const cornersCount: number = corners.map(k => neighboringCeils[k]).filter(c => c.terrain === ceil.terrain).length;
          // Посчитать
          return cornersCount > 0 ?
            CheckCeilTriangleForm(cX, cY, x, y, angle) :
            CheckCeilQuarterCircleForm(cX, cY, x, y, angle);
        }
      }
    }
  }
  // Координата вписывается в фигуру
  return true;
};

// Проверка круговой геометрии
export const CheckCeilCircleForm = (cX: number, cY: number, oX: number, oY: number): boolean => {
  const radius: number = DreamCeilSize / 2;
  const x: number = oX - cX - radius;
  const y: number = oY - cY - radius;
  // Результат
  return Math.pow(x, 2) + Math.pow(y, 2) < Math.pow(radius, 2);
};

// Проверка полукруговой геометрии
export const CheckCeilHalfCircleForm = (cX: number, cY: number, oX: number, oY: number, angle: number): boolean => {
  const borderDef: number[] = [-0.5, 0.5];
  const borderX: number[] = BordersX[angle] ?? borderDef;
  const borderY: number[] = BordersY[angle] ?? borderDef;
  const radius: number = DreamCeilSize / 2;
  const x: number = oX - cX - radius;
  const y: number = oY - cY - radius;
  // Результат
  return x >= borderX[0] && x <= borderX[1] && y >= borderY[0] && y <= borderY[1] ?
    true :
    CheckCeilCircleForm(cX, cY, oX, oY);
};

// Проверка треугольной геометрии
export const CheckCeilTriangleForm = (cX: number, cY: number, oX: number, oY: number, angle: number): boolean => {
  const triangle: XYCoord[] = TrianglesCoords[angle];
  // Проверка внутри треугольника
  if (!!triangle) {
    const traingleSquare: number = MathRound(TriangleSquare(triangle), 5);
    const x: number = oX - cX;
    const y: number = oY - cY;
    const checkCoord: XYCoord = { x, y };
    const checkCoords: XYCoord[][] = [
      [checkCoord, triangle[1], triangle[2]],
      [triangle[0], checkCoord, triangle[2]],
      [triangle[0], triangle[1], checkCoord],
    ];
    const checkSquaries: number = MathRound(checkCoords.map(c => TriangleSquare(c)).reduce((s, o) => s + o, 0), 5);
    // Вписывается
    return traingleSquare === checkSquaries;
  }
  // Не вписывается
  return false;
};

// Проверка геометрии четверти круга
export const CheckCeilQuarterCircleForm = (cX: number, cY: number, oX: number, oY: number, angle: number): boolean => {
  const radius: number = DreamCeilSize;
  const subtractorY: number = angle === 180 || angle === 270 ? -1 : 0;
  const subtractorX: number = Math.abs((angle === 90 || angle === 180 ? -1 : 0) - subtractorY) * -1;
  const x: number = oX - cX + subtractorX;
  const y: number = oY - cY + subtractorY;
  // Результат
  return Math.pow(x, 2) + Math.pow(y, 2) < Math.pow(radius, 2);
};
