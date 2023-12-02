import { createAction, createFeatureSelector, createReducer, createSelector, on, props } from "@ngrx/store";





// Название ключа в сторе
export const VIEWER_3D_KEY = "3d_viewer";

// Перечисление настроек перекрывающих вид
export enum Editor3DOverlaySettings {
  none = "none",
  time = "time"
}

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
  overlaySettings: Editor3DOverlaySettings;
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
  overlaySettings: Editor3DOverlaySettings.none,
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

// Обновить глобальные настройки
export const editor3DUpdateOverlaySettingsState = createAction(
  "[3D VIEWER] Updated an viewer overlay settings state",
  props<{ overlaySettings: Editor3DOverlaySettings }>()
);

// Обновить глобальные настройки: скрыть
export const editor3DSetNoneOverlaySettingsState = createAction("[3D VIEWER] Set an viewer overlay settings state as none");

// Создание стейта
export const viewer3DReducer = createReducer(
  viewer3DInitialState,
  // Изменить положение компаса
  on(viewer3DSetCompassAction, (state, compass) => ({ ...state, compass })),
  // Начать глобальную загрузку
  on(viewer3DInitialLoaderEnable, state => ({ ...state, loaders: { ...state.loaders, initial: true } })),
  // Начать глобальную загрузку
  on(viewer3DInitialLoaderDisable, state => ({ ...state, loaders: { ...state.loaders, initial: false } })),
  // Обновить глобальные настройки
  on(editor3DUpdateOverlaySettingsState, (state, { overlaySettings }) => ({ ...state, overlaySettings })),
  // Обновить глобальные настройки: скрыть
  on(editor3DSetNoneOverlaySettingsState, state => ({ ...state, overlaySettings: Editor3DOverlaySettings.none })),
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

// Текущая настройка, перекрывающая 3D просмотр
export const editor3DOverlaySettingsSelector = createSelector(viewer3DFeatureSelector, ({ overlaySettings }) => overlaySettings);

// Текущая настройка, перекрывающая 3D просмотр: статус
export const editor3DShowOverlaySettingsSelector = createSelector(editor3DOverlaySettingsSelector, overlaySettings => overlaySettings !== Editor3DOverlaySettings.none);

// Показ элементов управления
export const editor3DShowControlsSelector = createSelector(
  viewer3DInitialLoaderSelector,
  editor3DShowOverlaySettingsSelector,
  (initial, showSettings) => !initial && !showSettings
);
