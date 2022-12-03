import { CustomObjectKey } from "@_models/app";
import { DreamBaseElmsCount, DreamCeilParts, DreamCeilSize, DreamObjectElmsValues } from "@_models/dream-map-settings";





// Размер ячейки по ширине/глубине
export const WidthPart: number = DreamCeilSize;

// Количество частей в ячейке по высоте
export const HeightPart: number = DreamCeilSize / DreamCeilParts;

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
  [DreamObjectElmsValues.VeryLow]: DreamBaseElmsCount,
  [DreamObjectElmsValues.Low]: DreamBaseElmsCount,
  [DreamObjectElmsValues.Middle]: Math.round(DreamBaseElmsCount * 1.1),
  [DreamObjectElmsValues.High]: Math.round(DreamBaseElmsCount * 1.2),
  [DreamObjectElmsValues.VeryHigh]: Math.round(DreamBaseElmsCount * 1.3),
  [DreamObjectElmsValues.Ultra]: Math.round(DreamBaseElmsCount * 1.4),
  [DreamObjectElmsValues.Awesome]: Math.round(DreamBaseElmsCount * 1.5)
};
