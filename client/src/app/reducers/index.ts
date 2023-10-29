import { isDevMode } from '@angular/core';
import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { ACCOUNT_KEY, AccountState, accountReducer } from "./account";
import { NOTIFICATIONS_KEY, NotificationsState, notificationsReducer } from "./notifications";
import { TRANSLATE_KEY, TranslateState, translateReducer } from "./translate";
import { VIEWER_3D_KEY, Viewer3DState, viewer3DReducer } from "./viewer-3d";





// Интерфейс хранилища
export interface State {
  [ACCOUNT_KEY]: AccountState;
  [TRANSLATE_KEY]: TranslateState;
  [NOTIFICATIONS_KEY]: NotificationsState;
  [VIEWER_3D_KEY]: Viewer3DState;
}





// Редюсеры
export const reducers: ActionReducerMap<State> = {
  [ACCOUNT_KEY]: accountReducer,
  [TRANSLATE_KEY]: translateReducer,
  [NOTIFICATIONS_KEY]: notificationsReducer,
  [VIEWER_3D_KEY]: viewer3DReducer
};





export const metaReducers: MetaReducer<State>[] = isDevMode() ? [] : [];
