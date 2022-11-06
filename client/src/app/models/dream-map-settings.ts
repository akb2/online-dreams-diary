// Размер карты по умолчанию
export const DreamMapSize: number = 50;

// Размер ячейки по умолчанию
export const DreamCeilSize: number = 1;

// Количество секций по высоте в одной ячейке
export const DreamCeilParts: number = 64;

// Количество секций по высоте воды в одной ячейке
export const DreamCeilWaterParts: number = 1;

// Время для положения небесных тел по умолчанию
// * 0-360 соответствует времени 00:00 - 23:59
export const DreamSkyTime: number = 130;

// Пределы высот
export const DreamMinHeight: number = 1;
export const DreamDefHeight: number = DreamCeilParts * 10;
export const DreamMaxHeight: number = DreamCeilParts * 20;
export const DreamWaterDefHeight: number = DreamCeilParts * 9;

// Параметры по умолчанию
export const DreamSkyType: number = 1;
export const DreamTerrain: number = 1;
export const DreamFogNear: number = DreamMapSize * 0.8;
export const DreamFogFar: number = DreamMapSize * 2;
export const DreamHorizont: number = DreamFogFar * 2;
export const DreamOutsideSize: number = 2;
export const DreamLODDistance: number = 20;
export const DreamLODCount: number = Math.floor(DreamFogFar / DreamLODDistance);

// Заголовок по умолчанию
export const DreamTitle: string = "*** Новое сновидение ***";
export const DreamDescription: string = "*** Без описания ***";

// Настройки камеры
export const DreamCameraMinZoom: number = DreamCeilSize;
export const DreamCameraMaxZoom: number = DreamCeilSize * DreamMaxHeight / DreamCeilParts;

// Максимальное число элементов в ячейке
export enum DreamObjectElmsValues {
  VeryLow,
  Low,
  Middle,
  High,
  VeryHigh,
  Ultra,
  Awesome
};
export const DreamObjectDetalization: DreamObjectElmsValues = DreamObjectElmsValues.Awesome;
export const DreamMaxElmsCount: number = 32 * (DreamObjectDetalization + 1);
