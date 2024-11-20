import { User } from "@_models/account";
import { CustomObject, RouteData } from "@_models/app";
import { AccountService } from "@_services/account.service";
import { ApiService } from "@_services/api.service";
import { FriendService } from "@_services/friend.service";
import { SnackbarService } from "@_services/snackbar.service";
import { TokenService } from "@_services/token.service";
import { Injectable } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { DefaultExtraDatas, ExtraDatas } from "@app/app.component";
import { accountCheckAuthSelector } from "@app/reducers/account";
import { notificationsClearAction } from "@app/reducers/notifications";
import { Store } from "@ngrx/store";
import { Observable, map, of, switchMap, take, tap, first } from "rxjs";





@Injectable({
  providedIn: "root"
})

export class GlobalService {


  private mainTitle: string = "Online Dreams Diary";
  private titleSeparator: string = "|";

  user: User;





  // Дополнительные данные страницы
  private get getExtraDatas(): ExtraDatas {
    const extraDatas: CustomObject<any> = this.router.getCurrentNavigation()?.extras.state ?? {};
    // Найти данные
    return Object.entries(DefaultExtraDatas)
      .map(([k, v]) => ([k, extraDatas.hasOwnProperty(k) ? !!extraDatas[k] : v]))
      .reduce((o, [k, v]) => ({ ...o, [k as string]: !!v }), {} as ExtraDatas);
  }

  // Данные страинцы
  get getPageData(): RouteData {
    let snapshots = this.activatedRoute.snapshot;
    // Искать последнюю запись
    while (!!snapshots.firstChild) {
      snapshots = snapshots.firstChild;
    }
    // Вернуть данные
    return snapshots.data;
  }





  constructor(
    private accountService: AccountService,
    private friendService: FriendService,
    private store$: Store,
    private tokenService: TokenService,
    private router: Router,
    private apiService: ApiService,
    private snackBar: SnackbarService,
    private activatedRoute: ActivatedRoute
  ) { }





  init(): Observable<User> {
    return this.store$.select(accountCheckAuthSelector).pipe(
      first(),
      map(checkAuth => ({ ...this.getExtraDatas, checkAuth })),
      switchMap(({ checkAuth, checkToken }) => checkAuth && checkToken
        ? this.tokenService.checkToken(["9014", "9015", "9016"]).pipe(
          switchMap(code => {
            if (code === "0001") {
              return this.accountService.getUser(this.tokenService.userId);
            }
            // Ошибка проверки токена
            else {
              this.snackBar.open({
                "mode": "error",
                "message": this.apiService.getMessageByCode(code)
              });
              // Анонимный пользователь
              return of(null).pipe(
                tap(() => {
                  this.router.navigate([""]);
                  this.accountService.quit();
                  this.friendService.quit();
                  this.store$.dispatch(notificationsClearAction());
                })
              );
            }
          })
        )
        : of(null)
      ),
      tap(user => this.user = user)
    );
  }

  // Создать текст заголовка
  createTitle(mixedTitle: string | string[], subTitle: string = null, separator: string = null): string {
    subTitle = subTitle ?? this.mainTitle;
    separator = separator ?? this.titleSeparator;
    // Объеденить заголовки
    const title: string = Array.isArray(mixedTitle) ?
      mixedTitle.filter(t => !!t).join(" " + separator + " ") :
      mixedTitle;
    // Заголовок + подзаголовок
    if (!!title && !!subTitle) {
      return title + " " + separator + " " + subTitle;
    }
    // Только заголовок или подзаголовок
    else if (!!title || !!subTitle) {
      return !!title ? title : subTitle;
    }
    // Подзаголовок
    else {
      return this.mainTitle;
    }
  }
}
