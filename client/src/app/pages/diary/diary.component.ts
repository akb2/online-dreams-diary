import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { PaginateEvent } from "@_controlers/pagination/pagination.component";
import { SearchPanelComponent } from "@_controlers/search-panel/search-panel.component";
import { BackgroundImageDatas } from "@_datas/appearance";
import { DreamPlural } from "@_datas/dream";
import { CheckInRange, ParseInt } from "@_helpers/math";
import { User } from "@_models/account";
import { RouteData, SimpleObject } from "@_models/app";
import { BackgroundImageData } from "@_models/appearance";
import { Dream } from "@_models/dream";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { CanonicalService } from "@_services/canonical.service";
import { DreamService, SearchDream } from "@_services/dream.service";
import { GlobalService } from "@_services/global.service";
import { Observable, of, Subject, throwError, timer } from "rxjs";
import { concatMap, map, skipWhile, switchMap, takeUntil, takeWhile } from "rxjs/operators";





@Component({
  selector: "app-diary",
  templateUrl: "./diary.component.html",
  styleUrls: ["./diary.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DiaryComponent implements OnInit, OnDestroy {


  @ViewChild("searchPanel") private searchPanel!: SearchPanelComponent;

  imagePrefix: string = "../../../../assets/images/backgrounds/";
  pageData: RouteData;

  itsMyPage: boolean = false;
  itsAllPage: boolean = false;
  pageLoading: boolean = false;
  loading: boolean = true;
  private userReady: boolean = false;
  bottomPaginationIsAvail: boolean = false;

  private visitedUserId: number = -1;

  title: string = "";
  subTitle: string = "";
  backgroundImageData: BackgroundImageData = BackgroundImageDatas.find(d => d.id === 11);
  menuAvatarImage: string = "";
  menuAvatarIcon: string = "";
  floatButtonIcon: string;
  floatButtonLink: string;
  backButtonLink: string;

  private user: User;
  visitedUser: User;
  dreams: Dream[];
  dreamsCount: number = 0;

  pageCurrent: number = 1;
  pageLimit: number = 1;
  private pageCount: number = 1;

  isMobile: boolean = false;
  userHasAccess: boolean = false;
  private queryParams: SimpleObject = {};
  navMenuType: typeof NavMenuType = NavMenuType;

  dreamPlural: SimpleObject = DreamPlural;

  private destroyed$: Subject<void> = new Subject<void>();





  // Плавающая кнопка
  get floatButtonData(): SimpleObject {
    const data: SimpleObject = {};
    // Добавить сновидение
    if (!this.visitedUser) {
      data.from = "diary-all";
    }
    // Вернуть данные
    return data;
  }

  // Подписка на ожидание данных
  private waitObservable(callback: () => boolean): Observable<void> {
    return timer(1, 50).pipe(
      takeUntil(this.destroyed$),
      takeWhile(callback, true),
      skipWhile(callback),
      map(() => { })
    );
  }





  constructor(
    private accountService: AccountService,
    private activatedRoute: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef,
    private dreamService: DreamService,
    private titleService: Title,
    private router: Router,
    private globalService: GlobalService,
    private canonicalService: CanonicalService
  ) { }

  ngOnInit() {
    this.pageData = this.globalService.getPageData;
    // Запуск определения данных
    this.defineCurrentUser();
    this.defineUrlParams();
    this.defineVisitingUser();
    this.defineDreamsList();
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Ошибка подписки на пользователя
  private onUserFail(): void {
    this.router.navigate(["404"]);
  }

  // Установить параметры страницы
  private onUserLoaded(): void {
    let pageTitle: string;
    // Общее для дневника пользователя
    if (!this.itsAllPage) {
      this.title = this.visitedUser.name + " " + this.visitedUser.lastName;
      this.subTitle = "Дневник сновидений";
      this.backgroundImageData = this.visitedUser.settings.profileBackground;
      this.menuAvatarImage = this.visitedUser.avatars.middle;
      this.menuAvatarIcon = "person";
      this.backButtonLink = "/profile/" + this.visitedUser.id;
    }
    // Мой дневник
    if (this.itsMyPage) {
      this.floatButtonIcon = "add";
      this.floatButtonLink = "/diary/editor";
      this.canonicalService.setURL("diary/" + this.user.id, { p: this.pageCurrent }, { p: [0, 1] });
      // Заголовок вкладки
      pageTitle = this.globalService.createTitle("Мой дневник сновидений");
    }
    // Дневник другого пользователя
    else if (!this.itsAllPage) {
      this.canonicalService.setURL("diary/" + this.visitedUser.id, { p: this.pageCurrent }, { p: [0, 1] });
      // Заголовок вкладки
      pageTitle = this.globalService.createTitle([this.subTitle, this.title]);
    }
    // Общий дневник
    else {
      this.title = "Общий дневник";
      this.subTitle = "Все публичные сновидения";
      this.floatButtonIcon = !!this.user ? "add" : "";
      this.floatButtonLink = !!this.user ? "/diary/editor" : "";
      this.menuAvatarIcon = "content_paste_search";
      this.canonicalService.setURL("diary/all", { p: this.pageCurrent }, { p: [0, 1] });
      // Заголовок вкладки
      pageTitle = this.globalService.createTitle("Общий дневник");
    }
    // Готово к загрузке
    this.pageLoading = false;
    this.titleService.setTitle(pageTitle);
    this.changeDetectorRef.detectChanges();
  }

  // Сновидения не найдены
  private onNotDreamsFound(): void {
    this.dreamsCount = 0;
    this.dreams = [];
    this.loading = false;
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Изменение страницы
  onPageChange(event: PaginateEvent): void {
    const path: string[] = (this.router.url.split("?")[0]).split("/").filter(v => v.length > 0);
    // Настройки
    this.pageCurrent = event.pageCurrent;
    // Перейти к новой странице
    this.router.navigate(path, {
      queryParams: { ...this.queryParams, p: event.pageCurrent },
      queryParamsHandling: "merge",
      replaceUrl: true,
      state: {
        changeTitle: false,
        showPreLoader: false
      }
    });
    // Обновить список
    this.search();
  }





  // Определение текущего пользователя
  private defineCurrentUser(): void {
    this.pageLoading = true;
    this.changeDetectorRef.detectChanges();
    // Подписка
    this.accountService.user$()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(user => {
        this.user = user;
        this.userReady = true;
        this.changeDetectorRef.detectChanges();
      });
  }

  // Определение параметров URL
  private defineUrlParams(): void {
    this.pageLoading = true;
    this.changeDetectorRef.detectChanges();
    // Подписка
    this.waitObservable(() => !this.userReady)
      .pipe(
        concatMap(() => this.activatedRoute.params),
        concatMap(() => this.activatedRoute.queryParams, (params, queryParams) => ({ params, queryParams })),
        switchMap(({ params, queryParams }) => {
          let visitedUserId: number = 0;
          // Определение идентификатора пользователя
          if (ParseInt(this.pageData.userId) === -1) {
            if (params?.user_id === "0") {
              this.router.navigate(["/diary/" + this.user.id], { replaceUrl: true });
              // Вернуть ошибку
              return throwError("");
            }
            // Определить ID просматриваемого пользователя
            else {
              visitedUserId = ParseInt(params?.user_id, !!this.user ? this.user.id : 0);
            }
          }
          // Вернуть данные
          return of({ params, visitedUserId, queryParams });
        })
      )
      .subscribe(({ visitedUserId, queryParams }) => {
        this.pageCurrent = CheckInRange(ParseInt(queryParams?.p), Infinity, 1);
        this.visitedUserId = visitedUserId;
        this.itsMyPage = visitedUserId > 0 && visitedUserId === this.user?.id;
        this.itsAllPage = visitedUserId === 0;
        this.changeDetectorRef.detectChanges();
      });
  }

  // Определение просматриваемого пользователя
  private defineVisitingUser(): void {
    this.pageLoading = true;
    this.changeDetectorRef.detectChanges();
    // Подписка на данные пользователя
    this.waitObservable(() => this.visitedUserId === -1 || !this.userReady)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        if (this.itsAllPage) {
          this.visitedUser = null;
          this.userHasAccess = true;
          // Отрисовка сведений
          this.onUserLoaded();
        }
        // Чужая страница
        else {
          let visitedUserSync: boolean = false;
          // Моя страница
          if (this.itsMyPage) {
            visitedUserSync = true;
          }
          // Чужая страница
          else {
            this.accountService.getUser(this.visitedUserId, ["8100"])
              .pipe(takeUntil(this.destroyed$))
              .subscribe(() => visitedUserSync = true);
          }
          // Подписка
          this.waitObservable(() => !visitedUserSync)
            .pipe(
              concatMap(() => this.accountService.user$(this.visitedUserId, false)),
              takeUntil(this.destroyed$)
            )
            .subscribe(
              user => {
                this.visitedUser = user;
                this.userHasAccess = !!user?.hasAccess;
                // Отрисовка сведений
                this.onUserLoaded();
              },
              () => this.onUserFail()
            );
        }
      });
  }

  // Определение списка сновидений
  private defineDreamsList(): void {
    this.waitObservable(() => this.visitedUserId === -1 || (this.visitedUserId > 0 && !this.visitedUser))
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => this.search())
  }

  // Загрузка списка сновидений
  search(): void {
    this.loading = true;
    this.changeDetectorRef.detectChanges();
    // Поиск по сновидениям
    const search: SearchDream = {
      page: this.pageCurrent > 0 ? this.pageCurrent : 1,
      user: this.visitedUser?.id ?? 0,
      status: -1
    };
    // Запрос
    this.dreamService.search(search, ["0002"])
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        ({ result, count, limit, hasAccess }) => {
          this.userHasAccess = hasAccess;
          // Найдены сновидения
          if (count > 0) {
            this.dreamsCount = count;
            this.pageLimit = limit;
            this.pageCount = result.length;
            this.bottomPaginationIsAvail = this.pageCount > this.pageLimit / 2;
            this.dreams = result;
            this.loading = false;
            // Обновить
            this.changeDetectorRef.detectChanges();
          }
          // Сновидения не найдены
          else {
            this.onNotDreamsFound();
          }
        },
        () => this.onNotDreamsFound()
      );
  }

  // Показать фильтры
  openSearch(): void {
    this.searchPanel?.openPanel();
  }
}
