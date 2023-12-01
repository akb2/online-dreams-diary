import { createAction, createFeatureSelector, createReducer, createSelector, on, props } from "@ngrx/store";





// Название ключа в сторе
export const VIEWER_3D_KEY = "3d_viewer";

// Позиция компаса
export interface Viewer3DStateCompass {
  radial: number;
  azimuth: number;
  sin: number;
  cos: number;
}

// Интерфейс состояния
export interface Viewer3DState {
  compass: Viewer3DStateCompass;
  loaders: {
    initial: boolean;
  };
}

// Начальное состояние
const viewer3DInitialState: Viewer3DState = {
  compass: {
    radial: 0,
    azimuth: 0,
    sin: 0,
    cos: 0
  },
  loaders: {
    initial: false
  }
};





// Изменить положение компаса
export const viewer3DSetCompassAction = createAction(
  "[3D VIEWER] Save compass rotation",
  props<Viewer3DStateCompass>()
);

// Начать глобальную загрузку
export const viewer3DInitialLoaderEnable = createAction("[3D VIEWER] Enabled an initial loader");

// Остановить глобальную загрузку
export const viewer3DInitialLoaderDisable = createAction("[3D VIEWER] Disabled an initial loader");

// Создание стейта
export const viewer3DReducer = createReducer(
  viewer3DInitialState,
  // Изменить положение компаса
  on(viewer3DSetCompassAction, (state, compass) => ({ ...state, compass })),
  // Начать глобальную загрузку
  on(viewer3DInitialLoaderEnable, state => ({ ...state, loaders: { ...state.loaders, initial: true } })),
  // Начать глобальную загрузку
  on(viewer3DInitialLoaderDisable, state => ({ ...state, loaders: { ...state.loaders, initial: false } }))
);





// Общее состояние
export const viewer3DFeatureSelector = createFeatureSelector<Viewer3DState>(VIEWER_3D_KEY);

// Состояние компаса
export const viewer3DCompassSelector = createSelector(viewer3DFeatureSelector, ({ compass }) => compass);

// Поворот по сторонам света
export const viewer3DCompassRadialSelector = createSelector(viewer3DCompassSelector, ({ radial }) => radial);

// Наклон по высоте
export const viewer3DCompassAzimuthSelector = createSelector(viewer3DCompassSelector, ({ azimuth }) => azimuth);

// Лоадер инициализации редактора
export const viewer3DInitialLoaderSelector = createSelector(viewer3DFeatureSelector, ({ loaders: { initial } }) => initial);

// Показ элементов управления
export const editor3DInitialLoaderSelector = createSelector(viewer3DInitialLoaderSelector, initial => initial);
