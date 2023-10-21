import { isDevMode } from '@angular/core';
import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { ACCOUNT_KEY, AccountState, accountReducer } from "./account";
import { TRANSLATE_KEY, TranslateState, translateReducer } from "./translate";





// Интерфейс хранилища
export interface State {
  [ACCOUNT_KEY]: AccountState;
  [TRANSLATE_KEY]: TranslateState;
}





// Редюсеры
export const reducers: ActionReducerMap<State> = {
  [ACCOUNT_KEY]: accountReducer,
  [TRANSLATE_KEY]: translateReducer
};





export const metaReducers: MetaReducer<State>[] = isDevMode() ? [] : [];
