import { createAction, createFeatureSelector, createReducer, createSelector, on, props } from "@ngrx/store";





// Название ключа в сторе
export const ACCOUNT_KEY = "account";

// Интерфейс состояния
export interface AccountState {
  userId: number;
}

// Начальное состояние
export const accountInitialState: AccountState = {
  userId: 0
};





// Инициализация идентификатора пользователя
export const accountInitUserIdAction = createAction(
  "[ACCOUNT] Init user ID",
  props<{ userId: number }>()
);

// Сохранить идентификатор пользователя
export const accountSaveUserIdAction = createAction(
  "[ACCOUNT] Save user ID",
  props<{ userId: number }>()
);

// Удалить идентификатор пользователя
export const accountDeleteUserIdAction = createAction(
  "[ACCOUNT] Delete user ID"
);

// Создание стейта
export const accountReducer = createReducer(
  accountInitialState,
  // Инициализация идентификатора пользователя
  on(accountInitUserIdAction, (state, { userId }) => ({ ...state, userId })),
  // Сохранить идентификатор пользователя
  on(accountSaveUserIdAction, (state, { userId }) => ({ ...state, userId })),
  // Удалить идентификатор пользователя
  on(accountDeleteUserIdAction, state => ({ ...state, userId: 0 }))
);





// Общее состояние
export const accountFeatureSelector = createFeatureSelector<AccountState>(ACCOUNT_KEY);

// Текущий идентификатор пользователя
export const accountUserIdSelector = createSelector(accountFeatureSelector, ({ userId }) => userId);
