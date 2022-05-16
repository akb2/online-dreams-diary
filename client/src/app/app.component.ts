import { Component, OnDestroy, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from "@angular/router";
import { User } from "@_models/account";
import { RouteData } from "@_models/app";
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


  public static user: User;

  public mainTitle: string = "Online Dreams Diary";

  public showPreloader: boolean = true;
  public validToken: boolean = false;
  private pageData: RouteData;
  private loaderDelay: number = 150;

  private destroy$: Subject<void> = new Subject();





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
    // Подписка на пользователя
    this.accountService.user$.subscribe(
      user => AppComponent.user = user,
      () => AppComponent.user = null
    );
    // События старта и окочания лоадера
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.beforeLoadPage();
      }

      else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        let snapshots: ActivatedRouteSnapshot = this.activatedRoute.snapshot;
        while (snapshots.firstChild) {
          snapshots = snapshots.firstChild;
        }
        this.pageData = snapshots.data;
        // Функция обработчик
        this.afterLoadPage();
      }
    });
  }

  ngOnInit() {
    this.subscribeUser().subscribe(
      user => AppComponent.user = user,
      () => AppComponent.user = null
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Действия перед загрузкой страницы
  private beforeLoadPage(): void {
    // Пользователь авторизован, проверить токен
    const checkToken: boolean = !(this.router.getCurrentNavigation()?.extras.state?.checkToken == false);
    if (this.accountService.checkAuth && checkToken) {
      this.tokenService.checkToken(["9014", "9015", "9016"]).subscribe(code => {
        // Если токен валидный
        if (code == "0001") {
          this.accountService.syncCurrentUser().subscribe(() => {
            this.validToken = true;
          });
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
    const showPreloader: boolean = !(this.router.getCurrentNavigation()?.extras.state?.showPreLoader == false);
    if (showPreloader) {
      this.showPreloader = true;
      document.querySelectorAll("body, html").forEach(elm => elm.classList.add("no-scroll"));
    }
  }

  // Действия после загрузки страницы
  private afterLoadPage(): void {
    // Название страницы
    const title: string = this.pageData?.title || "";
    this.titleService.setTitle((title ? title + " | " : "") + this.mainTitle);
    // Отключение прелоадера
    timer(0, 100).pipe(
      takeWhile(() => this.showPreloader, true),
      switchMap(() => of(this.validToken)),
      delay(this.loaderDelay)
    ).subscribe(t => {
      if (t) {
        this.showPreloader = false;
        document.querySelectorAll("body, html").forEach(elm => elm.classList.remove("no-scroll"));
      }
    });
  }

  // Подписка на пользователя
  private subscribeUser(): Observable<User> {
    return this.accountService.user$.pipe(takeUntil(this.destroy$));
  }
}
