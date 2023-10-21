import { CurrentUserIdLocalStorageKey, CurrentUserIdLocalStorageTtl } from "@_datas/account";
import { LocalStorageRemove, LocalStorageSet } from "@_helpers/local-storage";
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from "rxjs";
import { accountDeleteUserIdAction, accountSaveUserIdAction } from "./reducers/account";





@Injectable()
export class AppEffects {

  constructor(
    private actions$: Actions
  ) { }





  // Сохранить ID пользователя в локал сторадж
  accountSaveUserId$ = createEffect(
    () => this.actions$.pipe(
      ofType(accountSaveUserIdAction),
      tap(({ userId }) => LocalStorageSet(CurrentUserIdLocalStorageKey, userId, CurrentUserIdLocalStorageTtl))
    ),
    { dispatch: false }
  );

  // Удалить ID пользователя в локал сторадж
  accountDeleteUserId$ = createEffect(
    () => this.actions$.pipe(
      ofType(accountDeleteUserIdAction),
      tap(() => LocalStorageRemove(CurrentUserIdLocalStorageKey))
    ),
    { dispatch: false }
  );
}
