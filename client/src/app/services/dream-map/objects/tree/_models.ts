import { CustomObjectKey } from "@_models/app";
import { DreamBaseElmsCount, DreamCeilParts, DreamCeilSize, DreamObjectElmsValues } from "@_models/dream-map-settings";





// Размер ячейки по ширине/глубине
export const WidthPart: number = DreamCeilSize;

// Количество частей в ячейке по высоте
export const HeightPart: number = DreamCeilSize / DreamCeilParts;

// Базовое минимальное количество для деревьев
export const DreamTreeElmsCount: number = Math.min(DreamBaseElmsCount, 24);

// Список количества геометрий дерева
export const TreeCounts: CustomObjectKey<DreamObjectElmsValues, number> = {
  [DreamObjectElmsValues.VeryLow]: 1,
  [DreamObjectElmsValues.Low]: 2,
  [DreamObjectElmsValues.Middle]: 3,
  [DreamObjectElmsValues.High]: 4,
  [DreamObjectElmsValues.VeryHigh]: 5,
  [DreamObjectElmsValues.Ultra]: 6,
  [DreamObjectElmsValues.Awesome]: 7,
};

// Список количества листвы на деревьях
export const LeafCounts: CustomObjectKey<DreamObjectElmsValues, number> = {
  [DreamObjectElmsValues.VeryLow]: DreamTreeElmsCount,
  [DreamObjectElmsValues.Low]: DreamTreeElmsCount,
  [DreamObjectElmsValues.Middle]: Math.round(DreamTreeElmsCount * 1.1),
  [DreamObjectElmsValues.High]: Math.round(DreamTreeElmsCount * 1.2),
  [DreamObjectElmsValues.VeryHigh]: Math.round(DreamTreeElmsCount * 1.3),
  [DreamObjectElmsValues.Ultra]: Math.round(DreamTreeElmsCount * 1.4),
  [DreamObjectElmsValues.Awesome]: Math.round(DreamTreeElmsCount * 1.5)
};
