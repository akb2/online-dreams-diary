import { Component, OnDestroy, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from "@angular/router";
import { User } from "@_models/account";
import { CustomObject, RouteData } from "@_models/app";
import { AccountService } from "@_services/account.service";
import { ApiService } from "@_services/api.service";
import { SnackbarService } from "@_services/snackbar.service";
import { TokenService } from "@_services/token.service";
import { Observable, of, Subject, timer } from "rxjs";
import { delay, switchMap, takeUntil, takeWhile } from "rxjs/operators";





@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})

export class AppComponent implements OnInit, OnDestroy {


  static user: User;

  private static mainTitle: string = "Online Dreams Diary";
  private static titleSeparator: string = "|";

  validToken: boolean = false;
  showPreLoader: boolean = true;
  private pageData: RouteData;
  private loaderDelay: number = 150;

  private destroy$: Subject<void> = new Subject();





  // Дополнительные данные страницы
  private get getExtraDatas(): ExtraDatas {
    const extraDatas: CustomObject<any> = this.router.getCurrentNavigation()?.extras.state ?? {};
    // Найти данные
    return Object.entries(DefaultExtraDatas)
      .map(([k, v]) => ([k, extraDatas.hasOwnProperty(k) ? !!extraDatas[k] : v]))
      .reduce((o, [k, v]) => ({ ...o, [k as string]: !!v }), {} as ExtraDatas);
  }





  constructor(
    private router: Router,
    private accountService: AccountService,
    private tokenService: TokenService,
    private snackBar: SnackbarService,
    private apiService: ApiService,
    private titleService: Title,
    private activatedRoute: ActivatedRoute
  ) {
    this.validToken = false;
  }

  ngOnInit() {
    this.subscribeUser().subscribe(
      user => AppComponent.user = user,
      () => AppComponent.user = null
    );
    // Подписка на пользователя
    this.accountService.user$.subscribe(
      user => AppComponent.user = user,
      () => AppComponent.user = null
    );
    // События старта и окочания лоадера
    this.router.events
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          this.beforeLoadPage();
        }
        // Конец роута
        else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
          this.pageData = AppComponent.getPageData(this.activatedRoute.snapshot);
          // Функция обработчик
          this.afterLoadPage();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Действия перед загрузкой страницы
  private beforeLoadPage(): void {
    const { checkToken, showPreLoader }: ExtraDatas = this.getExtraDatas;
    // ПРоверить токен
    if (this.accountService.checkAuth && checkToken) {
      this.tokenService.checkToken(["9014", "9015", "9016"]).subscribe(code => {
        // Если токен валидный
        if (code == "0001") {
          this.accountService.syncCurrentUser().subscribe(() => this.validToken = true);
        }
        // Токен не валидный
        else {
          this.router.navigate([""]);
          this.tokenService.deleteAuth();
          // Сообщение с ошибкой
          this.snackBar.open({
            "mode": "error",
            "message": this.apiService.getMessageByCode(code)
          });
        }
      });
    }
    // Пользователь неавторизован
    else {
      this.validToken = true;
    }
    // Запуск прелоадера
    if (showPreLoader) {
      this.showPreLoader = true;
      document.querySelectorAll("body, html").forEach(elm => elm.classList.add("no-scroll"));
    }
  }

  // Действия после загрузки страницы
  private afterLoadPage(): void {
    const { changeTitle }: ExtraDatas = this.getExtraDatas;
    // Сменить название страницы
    if (changeTitle) {
      this.titleService.setTitle(AppComponent.createTitle(this.pageData?.title));
    }
    // Отключение прелоадера
    timer(0, 100).pipe(
      takeWhile(() => this.showPreLoader, true),
      switchMap(() => of(this.validToken)),
      delay(this.loaderDelay)
    ).subscribe(t => {
      if (t) {
        this.showPreLoader = false;
        document.querySelectorAll("body, html").forEach(elm => elm.classList.remove("no-scroll"));
      }
    });
  }

  // Подписка на пользователя
  private subscribeUser(): Observable<User> {
    return this.accountService.user$.pipe(takeUntil(this.destroy$));
  }





  // Создать текст заголовка
  static createTitle(mixedTitle: string | string[], subTitle: string = null, separator: string = null): string {
    subTitle = subTitle ?? AppComponent.mainTitle;
    separator = separator ?? AppComponent.titleSeparator;
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
      return AppComponent.mainTitle;
    }
  }

  // Данные страинцы
  static getPageData(snapshots: ActivatedRouteSnapshot): RouteData {
    while (!!snapshots.firstChild) {
      snapshots = snapshots.firstChild;
    }
    // Вернуть данные
    return snapshots.data;
  }
}





interface ExtraDatas {
  checkToken: boolean;
  showPreLoader: boolean;
  changeTitle: boolean;
}

const DefaultExtraDatas: ExtraDatas = {
  checkToken: true,
  showPreLoader: true,
  changeTitle: true
};
