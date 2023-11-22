import { DreamMapSettings } from "@_models/dream-map";





// Размер карты по умолчанию
export const DreamMapSize = 96;

// Размер ячейки по умолчанию
export const DreamCeilSize = 1;

// Количество секций по высоте в одной ячейке
export const DreamCeilParts = 64;

// Количество секций по высоте воды в одной ячейке
export const DreamCeilWaterParts = 1;

// Время для положения небесных тел по умолчанию
// ? 0-360 соответствует времени 00:00 - 23:59
export const DreamSkyTime = 180;

// Пределы высот
export const DreamMinHeight = 1;
export const DreamDefHeight = -1;
export const DreamMaxHeight = DreamCeilParts * 20;
export const DreamWaterDefHeight = DreamCeilParts * 9;

// Допустимый перепад высот без сглаживания
// ? В процентах 0-100
export const DreamAvailHeightDiff = 0.05;

// Параметры по умолчанию
export const DreamSkyType = 1;
export const DreamTerrain = 1;
export const DreamFogFar = 60;
export const DreamFogNear = DreamFogFar / 2;
export const DreamHorizont = DreamFogFar * 3;
export const DreamOutsideSize = 1;
export const LODMaxDistance = (DreamFogFar + DreamFogNear) / 2;

// Заголовок по умолчанию
export const DreamTitle = "*** Новое сновидение ***";
export const DreamDescription = "*** Без описания ***";

// Настройки камеры
export const DreamCameraMinZoom = DreamCeilSize;
export const DreamCameraMaxZoom = DreamCeilSize * DreamMaxHeight / DreamCeilParts;

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
export const DreamBaseElmsCount = 128;
export const DreamShadowQualitySize = 1024;
export const DreamMaxElmsCount = (d: DreamObjectElmsValues) => DreamBaseElmsCount * (d + 1);
export const DreamMapMinShadowQuality = 1;
export const DreamMapMaxShadowQuality = 7;
export const DreamMapDefaultShadowQuality = 2;

export const DefaultDreamMapSettings: DreamMapSettings = {
  detalization: DreamObjectElmsValues.Middle,
  shadowQuality: DreamMapDefaultShadowQuality,
};
