import { isDevMode } from '@angular/core';
import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { ACCOUNT_KEY, AccountState, accountReducer } from "./account";
import { NOTIFICATIONS_KEY, NotificationsState, notificationsReducer } from "./notifications";
import { TRANSLATE_KEY, TranslateState, translateReducer } from "./translate";
import { VIEWER_3D_KEY, Viewer3DState, viewer3DReducer } from "./viewer-3d";
import { APP_KEY, appInitialState, appReducer, AppState } from "./app";





// Интерфейс хранилища
export interface State {
  [APP_KEY]: AppState;
  [ACCOUNT_KEY]: AccountState;
  [TRANSLATE_KEY]: TranslateState;
  [NOTIFICATIONS_KEY]: NotificationsState;
  [VIEWER_3D_KEY]: Viewer3DState;
}





// Редюсеры
export const reducers: ActionReducerMap<State> = {
  [APP_KEY]: appReducer,
  [ACCOUNT_KEY]: accountReducer,
  [TRANSLATE_KEY]: translateReducer,
  [NOTIFICATIONS_KEY]: notificationsReducer,
  [VIEWER_3D_KEY]: viewer3DReducer
};





export const metaReducers: MetaReducer<State>[] = isDevMode() ? [] : [];
