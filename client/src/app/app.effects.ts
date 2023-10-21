import { CurrentUserIdLocalStorageKey, CurrentUserIdLocalStorageTtl } from "@_datas/account";
import { LanguageLocalStorageKey, LocalStorageTtl } from "@_datas/translate";
import { LocalStorageGet, LocalStorageRemove, LocalStorageSet } from "@_helpers/local-storage";
import { ParseInt } from "@_helpers/math";
import { GetDetectedLanguage } from "@_helpers/translate";
import { Injectable } from '@angular/core';
import { Actions, ROOT_EFFECTS_INIT, createEffect, ofType } from '@ngrx/effects';
import { map, tap } from "rxjs/operators";
import { accountDeleteUserIdAction, accountInitUserIdAction, accountSaveUserIdAction } from "./reducers/account";
import { translateInitLanguageAction, translateSaveLanguageAction } from "./reducers/translate";





@Injectable()

export class AppEffects {

  constructor(
    private actions$: Actions
  ) { }





  // Инициализация ID пользователя при старте
  accountInitUserId$ = createEffect(
    () => this.actions$.pipe(
      ofType(ROOT_EFFECTS_INIT),
      map(() => accountInitUserIdAction({ userId: ParseInt(LocalStorageGet(CurrentUserIdLocalStorageKey)) }))
    )
  );

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





  // Инициализация текущего языка
  translateInitLanguage$ = createEffect(
    () => this.actions$.pipe(
      ofType(ROOT_EFFECTS_INIT),
      map(() => translateInitLanguageAction({ language: GetDetectedLanguage() }))
    )
  );

  // Сменить язык
  translateSaveLanguage$ = createEffect(
    () => this.actions$.pipe(
      ofType(translateSaveLanguageAction),
      tap(({ language }) => LocalStorageSet(LanguageLocalStorageKey, language, LocalStorageTtl))
    ),
    { dispatch: false }
  );
}
