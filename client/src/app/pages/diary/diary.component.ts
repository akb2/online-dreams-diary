import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { AppComponent } from "@app/app.component";
import { NavMenuComponent } from "@_controlers/nav-menu/nav-menu.component";
import { PaginateEvent } from "@_controlers/pagination/pagination.component";
import { User } from "@_models/account";
import { RouteData, SimpleObject } from "@_models/app";
import { BackgroundImageData, BackgroundImageDatas } from "@_models/appearance";
import { Dream } from "@_models/dream";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { DreamService, SearchDream } from "@_services/dream.service";
import { ScreenService } from "@_services/screen.service";
import { Observable, of, Subject } from "rxjs";
import { takeUntil, tap } from "rxjs/operators";





@Component({
  selector: "app-diary",
  templateUrl: "./diary.component.html",
  styleUrls: ["./diary.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DiaryComponent implements OnInit, DoCheck, OnDestroy {


  @ViewChild("mainMenu") private mainMenu!: NavMenuComponent;

  imagePrefix: string = "../../../../assets/images/backgrounds/";
  pageData: RouteData;
  ready: boolean = false;
  loading: boolean = true;

  title: string = "Общий дневник";
  subTitle: string = "Все публичные сновидения";
  private pageTitle: string;
  backgroundImageData: BackgroundImageData = BackgroundImageDatas.find(d => d.id === 11);
  menuAvatarImage: string = "";
  menuAvatarIcon: string = "";
  floatButtonIcon: string;
  floatButtonLink: string;
  backButtonLink: string;

  oldUser: User;
  visitedUser: User;
  dreams: Dream[];
  dreamsCount: number = 0;

  pageCurrent: number = 1;
  pageLimit: number = 1;
  pageCount: number = 1;

  isMobile: boolean = false;
  private queryParams: SimpleObject = {};
  navMenuType: typeof NavMenuType = NavMenuType;

  dreamPlural: SimpleObject = {
    "=0": "",
    "=1": "# сновидение",
    "few": "# сновидения",
    "other": "# сновидений"
  };

  private destroy$: Subject<void> = new Subject<void>();





  // Текущий пользователь
  get user(): User {
    return AppComponent.user;
  };

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

  // Показывать ли нижний пагинатор
  get bottomPaginationIsAvail(): boolean {
    return this.pageCount > this.pageLimit / 2;
  }





  constructor(
    private accountService: AccountService,
    private activatedRoute: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef,
    private dreamService: DreamService,
    private titleService: Title,
    private router: Router,
    private screenService: ScreenService
  ) { }

  ngDoCheck() {
    if (this.accountService.checkAuth && this.oldUser?.id !== this.user?.id) {
      this.oldUser = this.user;
    }
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.pageData = AppComponent.getPageData(this.activatedRoute.snapshot);
      this.queryParams = params as SimpleObject;
      this.pageCurrent = parseInt(params.p) || 1;
      // Функция обработчик
      this.defineData();
    });
    // Подписка на тип устройства
    this.screenService.isMobile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
        this.changeDetectorRef.detectChanges();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Ошибка подписки на пользователя
  private onUserFail(): void {
    this.router.navigate(["404"]);
  }

  // Сновидения не найдены
  private onNotDreamsFound(): void {
    this.dreamsCount = 0;
    this.dreams = [];
    this.loading = false;
    this.titleService.setTitle(this.pageTitle);
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





  // Подписка на пользователя
  private subscribeUser(userId: number = this.user.id): Observable<User> {
    const observable: Observable<User> = !!userId ? this.accountService.getUser(userId) : of(null);
    // Подписка
    return observable.pipe(
      takeUntil(this.destroy$),
      tap(user => {
        if (userId > 0) {
          this.visitedUser = user;
          // Обновить
          this.changeDetectorRef.detectChanges();
        }
      })
    );
  }

  // Определить данные
  private defineData(): void {
    // Мой дневник
    if (this.pageData.userId === -1 || (!!this.user && this.pageData.userId === this.user.id)) {
      if (this.pageData.userId === -1) {
        this.router.navigate(["diary", this.user.id.toString()], { queryParamsHandling: "merge", replaceUrl: true });
      }
    }
    // Дневник другого пользователя
    else if (this.pageData.userId === -2 || (!!this.user && this.pageData.userId > 0 && this.pageData.userId !== this.user.id)) {
      this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
        this.pageData.userId = parseInt(params["user_id"]);
        // Подписка
        if (!this.user || (!!this.user && this.pageData.userId !== this.user.id)) {
          this.subscribeUser(this.pageData.userId).subscribe(
            () => this.setPageData(),
            () => this.onUserFail()
          );
        }
        // Текущий пользователь
        else {
          this.setPageData();
        }
      });
    }
    // Общий дневник
    else {
      this.pageData.userId = 0;
      this.setPageData();
    }
  }

  // Установить параметры страницы
  private setPageData(): void {
    // Мой дневник
    if (this.pageData.userId > 0 && !!this.user && this.pageData.userId === this.user.id) {
      this.title = this.user.name + " " + this.user.lastName;
      this.subTitle = "Мой дневник сновидений";
      this.pageTitle = AppComponent.createTitle(this.subTitle);
      this.backgroundImageData = this.user.settings.profileBackground;
      this.menuAvatarImage = this.user.avatars.middle;
      this.menuAvatarIcon = "person";
      this.floatButtonIcon = "add";
      this.floatButtonLink = "/diary/editor";
      // Установить посещаемого пользователя из текущего
      this.visitedUser = this.user;
      // Готово
      this.ready = true;
    }
    // Дневник другого пользователя
    else if (this.pageData.userId > 0 && ((!!this.user && this.pageData.userId !== this.user.id) || !this.user)) {
      this.title = this.visitedUser.name + " " + this.visitedUser.lastName;
      this.subTitle = "Дневник сновидений";
      this.pageTitle = AppComponent.createTitle([this.subTitle, this.title]);
      this.backgroundImageData = this.visitedUser.settings.profileBackground;
      this.menuAvatarImage = this.visitedUser.avatars.middle;
      this.menuAvatarIcon = "person";
      this.backButtonLink = "/profile/" + this.visitedUser.id;
      // Готово
      this.ready = true;
    }
    // Общий дневник
    else {
      if (this.user) {
        this.floatButtonIcon = "add";
        this.floatButtonLink = "/diary/editor";
      }
      // Для неавторизованного пользователя
      else {
        this.floatButtonIcon = "";
        this.floatButtonLink = "";
      }
      // Название страницы
      this.pageTitle = AppComponent.createTitle(this.title);
      // Готово
      this.ready = true;
    }
    // Готово к загрузке
    if (this.ready) {
      this.changeDetectorRef.detectChanges();
      this.search();
    }
  }

  // Загрузка списка сновидений
  search(): void {
    this.loading = true;
    this.changeDetectorRef.detectChanges();
    this.titleService.setTitle(this.pageTitle);
    // Поиск по сновидениям
    const search: SearchDream = {
      page: this.pageCurrent > 0 ? this.pageCurrent : 1,
      user: this.pageData.userId || 0,
      status: -1
    };
    // Загрузка списка
    this.dreamService.search(search, ["0002"]).subscribe(
      ({ count, result: dreams, limit }) => {
        // Найдены сновидения
        if (count > 0) {
          this.dreamsCount = count;
          this.pageLimit = limit;
          this.pageCount = dreams.length;
          this.dreams = dreams;
          this.loading = false;
          this.titleService.setTitle(this.pageTitle);
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
}
