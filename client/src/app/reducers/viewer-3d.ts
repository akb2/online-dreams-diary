import { Editor3DTool, Editor3DToolSettings } from "@_datas/3d";
import { XYCoord } from "@_models/dream-map";
import { createAction, createFeatureSelector, createReducer, createSelector, on, props } from "@ngrx/store";





// Название ключа в сторе
export const VIEWER_3D_KEY = "3d_viewer";

// Перечисление настроек перекрывающих вид
export enum Editor3DOverlaySettings {
  none = "none",
  time = "time",
  worldOcean = "world_ocean"
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
  skyTime: number;
  worldOceanHeight: number;
  loaders: {
    initial: boolean;
  };
  hoverCeil: XYCoord;
  currentTool: Editor3DToolSettings;
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
  skyTime: 0,
  worldOceanHeight: 0,
  loaders: {
    initial: true
  },
  hoverCeil: { x: -1, y: -1 },
  currentTool: {
    type: Editor3DTool.landscape,
    collapseSize: false,
    size: 1
  }
};





// Изменить положение компаса
export const viewer3DSetCompassAction = createAction(
  "[3D VIEWER] Save compass rotation",
  props<Viewer3DStateCompass>()
);

// Начать глобальную загрузку
export const viewer3DInitialLoaderEnableAction = createAction("[3D VIEWER] Enabled an initial loader");

// Остановить глобальную загрузку
export const viewer3DInitialLoaderDisableAction = createAction("[3D VIEWER] Disabled an initial loader");

// Обновить глобальные настройки
export const editor3DUpdateOverlaySettingsStateAction = createAction(
  "[3D EDITOR] Updated an viewer overlay settings state",
  props<{ overlaySettings: Editor3DOverlaySettings }>()
);

// Обновить глобальные настройки: скрыть
export const editor3DSetNoneOverlaySettingsStateAction = createAction("[3D EDITOR] Set an viewer overlay settings state as none");

// Обновить текущее время
export const editor3DSetSkyTimeAction = createAction(
  "[3D EDITOR] Set sky time",
  props<Pick<Viewer3DState, "skyTime">>()
);

// Обновить текущую высоту океана
export const editor3DSetWorldOceanHeightAction = createAction(
  "[3D EDITOR] Set world ocean height",
  props<Pick<Viewer3DState, "worldOceanHeight">>()
);

// Обновить текущую ячейку, выделенную мышкой
export const editor3DHoveringCeil = createAction(
  "[3D EDITOR] Hovered a ceil",
  props<{ hoverCeil: XYCoord }>()
);

// Создание стейта
export const viewer3DReducer = createReducer(
  viewer3DInitialState,
  // Изменить положение компаса
  on(viewer3DSetCompassAction, (state, compass) => ({ ...state, compass })),
  // Начать глобальную загрузку
  on(viewer3DInitialLoaderEnableAction, state => ({ ...state, loaders: { ...state.loaders, initial: true } })),
  // Начать глобальную загрузку
  on(viewer3DInitialLoaderDisableAction, state => ({ ...state, loaders: { ...state.loaders, initial: false } })),
  // Обновить глобальные настройки
  on(editor3DUpdateOverlaySettingsStateAction, (state, { overlaySettings }) => ({ ...state, overlaySettings })),
  // Обновить глобальные настройки: скрыть
  on(editor3DSetNoneOverlaySettingsStateAction, state => ({ ...state, overlaySettings: Editor3DOverlaySettings.none })),
  // Обновить текущее время
  on(editor3DSetSkyTimeAction, (state, { skyTime }) => ({ ...state, skyTime })),
  // Обновить текущую ячейку, выделенную мышкой
  on(editor3DSetWorldOceanHeightAction, (state, { worldOceanHeight }) => ({ ...state, worldOceanHeight })),
  // Обновить текущую ячейку, выделенную мышкой
  on(editor3DHoveringCeil, (state, { hoverCeil }) => ({ ...state, hoverCeil }))
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

// Текущее время суток
export const editor3DSkyTimeSelector = createSelector(viewer3DFeatureSelector, ({ skyTime }) => skyTime);

// Текущая высота мирового океана
export const editor3DWorldOceanHeightSelector = createSelector(viewer3DFeatureSelector, ({ worldOceanHeight }) => worldOceanHeight);

// Координаты текущей ячейки, в фокусе мышки
export const editor3DHoverCeilCoordsSelector = createSelector(viewer3DFeatureSelector, ({ hoverCeil }) => hoverCeil);

// Выделение за пределами карты
export const editor3DHoverInWorkAreaSelector = createSelector(editor3DHoverCeilCoordsSelector, ({ x, y }) => x >= 0 && y >= 0);

// Текущий размер курсора
export const editor3DCursorSelector = createSelector(viewer3DFeatureSelector, ({ currentTool }) => currentTool);

// Текущий размер курсора
export const editor3DCursorSizeSelector = createSelector(editor3DCursorSelector, ({ size }) => size);
