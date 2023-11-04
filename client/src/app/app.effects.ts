import { CurrentUserIdLocalStorageKey, CurrentUserIdLocalStorageTtl } from "@_datas/account";
import { ToArray } from "@_datas/app";
import { NOTIFICATIONS_LOCAL_STORAGE_KEY, NOTIFICATIONS_LOCAL_STORAGE_TTL } from "@_datas/notification";
import { LanguageLocalStorageKey, LocalStorageTtl } from "@_datas/translate";
import { LocalStorageGet, LocalStorageRemove, LocalStorageSet } from "@_helpers/local-storage";
import { ParseInt } from "@_helpers/math";
import { GetDetectedLanguage } from "@_helpers/translate";
import { Injectable } from '@angular/core';
import { Actions, ROOT_EFFECTS_INIT, createEffect, ofType } from '@ngrx/effects';
import { Store } from "@ngrx/store";
import { TranslateService } from "@ngx-translate/core";
import { concatMap, map, tap, withLatestFrom } from "rxjs/operators";
import { accountDeleteUserIdAction, accountInitUserIdAction, accountSaveUserIdAction } from "./reducers/account";
import { notificationsAddOneAction, notificationsAddSomeAction, notificationsClearAction, notificationsInitAction, notificationsReplaceAction, notificationsSelector } from "./reducers/notifications";
import { translateChangeLanguageAction, translateInitLanguageAction, translateSaveLanguageAction } from "./reducers/translate";





@Injectable()

export class AppEffects {

  constructor(
    private actions$: Actions,
    private translateService: TranslateService,
    private store$: Store
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

  // Удалить ID пользователя из локал сторадж
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
      ofType(translateInitLanguageAction, translateChangeLanguageAction),
      tap(({ language }) => LocalStorageSet(LanguageLocalStorageKey, language, LocalStorageTtl)),
      concatMap(({ language }) => this.translateService.use(language), ({ language }) => language),
      map(language => translateSaveLanguageAction({ language }))
    )
  );





  // Инициализация списка уведомлений
  notificationsInitAction$ = createEffect(
    () => this.actions$.pipe(
      ofType(ROOT_EFFECTS_INIT),
      map(() => notificationsInitAction({ notifications: ToArray(LocalStorageGet(NOTIFICATIONS_LOCAL_STORAGE_KEY)) }))
    )
  );

  // Добавить одно уведомление
  notificationsAddOneAction$ = createEffect(
    () => this.actions$.pipe(
      ofType(notificationsAddOneAction),
      withLatestFrom(this.store$.select(notificationsSelector)),
      tap(([, notifications]) => LocalStorageSet(NOTIFICATIONS_LOCAL_STORAGE_KEY, notifications, NOTIFICATIONS_LOCAL_STORAGE_TTL))
    ),
    { dispatch: false }
  );

  // Добавить несколько уведомлений
  notificationsAddSomeAction$ = createEffect(
    () => this.actions$.pipe(
      ofType(notificationsAddSomeAction),
      withLatestFrom(this.store$.select(notificationsSelector)),
      tap(([, notifications]) => LocalStorageSet(NOTIFICATIONS_LOCAL_STORAGE_KEY, notifications, NOTIFICATIONS_LOCAL_STORAGE_TTL))
    ),
    { dispatch: false }
  );

  // Заменить весь список
  notificationsReplaceAction$ = createEffect(
    () => this.actions$.pipe(
      ofType(notificationsReplaceAction),
      tap(({ notifications }) => LocalStorageSet(NOTIFICATIONS_LOCAL_STORAGE_KEY, notifications, NOTIFICATIONS_LOCAL_STORAGE_TTL))
    ),
    { dispatch: false }
  );

  // Очистить список
  notificationsClearAction$ = createEffect(
    () => this.actions$.pipe(
      ofType(notificationsClearAction),
      tap(() => LocalStorageRemove(NOTIFICATIONS_LOCAL_STORAGE_KEY))
    ),
    { dispatch: false }
  );
}
