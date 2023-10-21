import { isDevMode } from '@angular/core';
import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { ACCOUNT_KEY, AccountState, accountReducer } from "./account";





// Интерфейс хранилища
export interface State {
  [ACCOUNT_KEY]: AccountState;
}





// Редюсеры
export const reducers: ActionReducerMap<State> = {
  [ACCOUNT_KEY]: accountReducer
};





export const metaReducers: MetaReducer<State>[] = isDevMode() ? [] : [];
