import { DreamMapSettings } from "@_models/dream-map";





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
export const DreamSkyTime: number = 180;

// Пределы высот
export const DreamMinHeight: number = 1;
export const DreamDefHeight: number = DreamCeilParts * 10;
export const DreamMaxHeight: number = DreamCeilParts * 20;
export const DreamWaterDefHeight: number = DreamCeilParts * 9;

// Параметры по умолчанию
export const DreamSkyType: number = 1;
export const DreamTerrain: number = 1;
export const DreamFogNear: number = DreamMapSize * 0.5;
export const DreamFogFar: number = DreamMapSize;
export const DreamHorizont: number = DreamFogFar * 3;
export const DreamOutsideSize: number = 1;
export const LODMaxDistance: number = (DreamFogFar + DreamFogNear) / 2;

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
export const DreamBaseElmsCount: number = 32;
export const DreamShadowQualitySize: number = 1024;
export const DreamMaxElmsCount: (d: DreamObjectElmsValues) => number = (d: DreamObjectElmsValues) => DreamBaseElmsCount * (d + 1);
export const DreamMapMinShadowQuality: number = 1;
export const DreamMapMaxShadowQuality: number = 7;
export const DreamMapDefaultShadowQuality: number = 2;

export const DefaultDreamMapSettings: DreamMapSettings = {
  detalization: DreamObjectElmsValues.Middle,
  shadowQuality: DreamMapDefaultShadowQuality,
};
