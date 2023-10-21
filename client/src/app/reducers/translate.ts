import { Language } from "@_models/translate";
import { createAction, createFeatureSelector, createReducer, createSelector, on, props } from "@ngrx/store";





// Название ключа в сторе
export const TRANSLATE_KEY = "translate";

// Интерфейс состояния
export interface TranslateState {
  language: Language;
}

// Начальное состояние
export const translateInitialState: TranslateState = {
  language: Language.en
};





// Инициализация текущего языка
export const translateInitLanguageAction = createAction(
  "[TRANSLATE] Init language",
  props<{ language: Language }>()
);

// Сменить язык
export const translateSaveLanguageAction = createAction(
  "[TRANSLATE] Change language",
  props<{ language: Language }>()
);

// Создание стейта
export const translateReducer = createReducer(
  translateInitialState,
  // Инициализация текущего языка
  on(translateInitLanguageAction, (state, { language }) => ({ ...state, language })),
  // Сменить язык
  on(translateSaveLanguageAction, (state, { language }) => ({ ...state, language }))
);





// Общее состояние
export const translateFeatureSelector = createFeatureSelector<TranslateState>(TRANSLATE_KEY);

// Текущий идентификатор пользователя
export const translateLanguageSelector = createSelector(translateFeatureSelector, ({ language }) => language);

// Нужен ли пайп Петровича
export const translateNeedPetrovichSelector = createSelector(translateFeatureSelector, ({ language }) => language === Language.ru);
