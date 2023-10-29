import { createAction, createFeatureSelector, createReducer, createSelector, on, props } from "@ngrx/store";





// Название ключа в сторе
export const VIEWER_3D_KEY = "3d_viewer";

// Позиция компаса
export interface Viewer3DStateCompass {
  radial: number;
  azimuth: number;
}

// Интерфейс состояния
export interface Viewer3DState {
  compass: Viewer3DStateCompass;
}

// Начальное состояние
const viewer3DInitialState: Viewer3DState = {
  compass: {
    radial: 0,
    azimuth: 0
  }
};





// Сохранить идентификатор пользователя
export const viewer3DSetCompassAction = createAction(
  "[3D VIEWER] Save compass rotation",
  props<Viewer3DStateCompass>()
);

// Создание стейта
export const viewer3DReducer = createReducer(
  viewer3DInitialState,
  // Инициализация идентификатора пользователя
  on(viewer3DSetCompassAction, (state, compass) => ({ ...state, compass }))
);





// Общее состояние
export const viewer3DFeatureSelector = createFeatureSelector<Viewer3DState>(VIEWER_3D_KEY);

// Состояние компаса
export const viewer3DCompassSelector = createSelector(viewer3DFeatureSelector, ({ compass }) => compass);

// Поворот по сторонам света
export const viewer3DCompassRadialSelector = createSelector(viewer3DCompassSelector, ({ radial }) => radial);

// Наклон по высоте
export const viewer3DCompassAzimuthSelector = createSelector(viewer3DCompassSelector, ({ azimuth }) => azimuth);
