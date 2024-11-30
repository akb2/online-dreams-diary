import { ToBoolean } from "@_helpers/app";
import { ParseInt } from "@_helpers/math";
import { createAction, createFeatureSelector, createReducer, createSelector, on, props } from "@ngrx/store";





// Название ключа в сторе
export const APP_KEY = "app";

// Интерфейс состояния
export interface AppState {
  userSelect: boolean;
}

// Начальное состояние
export const appInitialState: AppState = {
  userSelect: true
};





// Установить возможность выделения элементов
export const appSetUserSelectAction = createAction(
  "[APP] Change an user selection availibility state",
  props<Pick<AppState, "userSelect">>()
);

// Создание стейта
export const appReducer = createReducer(
  appInitialState,
  // Установить возможность выделения элементов
  on(appSetUserSelectAction, (state, { userSelect }) => ({ ...state, userSelect })),
);





// Общее состояние
export const appFeatureSelector = createFeatureSelector<AppState>(APP_KEY);

// Текущее состояние возможности выделения элементов
export const userSelectSelector = createSelector(appFeatureSelector, ({ userSelect }) => ToBoolean(userSelect));
