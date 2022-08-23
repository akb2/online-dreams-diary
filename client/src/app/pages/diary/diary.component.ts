import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { AppComponent } from "@app/app.component";
import { PaginateEvent } from "@_controlers/pagination/pagination.component";
import { SearchPanelComponent } from "@_controlers/search-panel/search-panel.component";
import { User } from "@_models/account";
import { RouteData, SimpleObject } from "@_models/app";
import { BackgroundImageData, BackgroundImageDatas } from "@_models/appearance";
import { Dream, DreamPlural } from "@_models/dream";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { DreamService, SearchDream } from "@_services/dream.service";
import { ScreenService } from "@_services/screen.service";
import { of, Subject, throwError } from "rxjs";
import { filter, mergeMap, switchMap, takeUntil } from "rxjs/operators";





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

  user: User;
  visitedUser: User;
  dreams: Dream[];
  dreamsCount: number = 0;

  pageCurrent: number = 1;
  pageLimit: number = 1;
  pageCount: number = 1;

  isMobile: boolean = false;
  private queryParams: SimpleObject = {};
  navMenuType: typeof NavMenuType = NavMenuType;

  dreamPlural: SimpleObject = DreamPlural;

  private destroy$: Subject<void> = new Subject<void>();





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

  ngOnInit() {
    this.pageData = AppComponent.getPageData(this.activatedRoute.snapshot);
    // Текущий пользователь и параметры URL
    this.defineData();
    /*
    this.activatedRoute.queryParams.subscribe(params => {
      this.pageData = AppComponent.getPageData(this.activatedRoute.snapshot);
      this.queryParams = params as SimpleObject;
      this.pageCurrent = parseInt(params.p) || 1;
      // Текущий пользователь
      this.accountService.user$
        .pipe(takeUntil(this.destroy$))
        .subscribe(user => {
          this.user = user;
          this.defineData();
        });
      // Подписка на тип устройства
      this.screenService.isMobile$
        .pipe(takeUntil(this.destroy$))
        .subscribe(isMobile => {
          this.isMobile = isMobile;
          this.changeDetectorRef.detectChanges();
        });
    });
    */
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





  // Определить данные
  private defineData(): void {
    this.accountService.user$.pipe(
      takeUntil(this.destroy$),
      switchMap(user => this.pageData.userId === -1 ? throwError({ user }) : of({ user })),
      mergeMap(() => this.activatedRoute.params, (o, params) => ({ ...o, params })),
      filter(({ params }) => !!params),
      switchMap(r => (parseInt(r.params.user_id) > 0 && !isNaN(r.params.user_id)) || this.pageData.userId === 0 ?
        of(r) :
        throwError(r)
      ),
      mergeMap(({ params, user }) =>
        (!!user && user.id !== parseInt(params.user_id)) || (!user && this.pageData.userId === -2) ?
          this.pageData.userId === 0 ?
            of(null) :
            this.accountService.getUser(parseInt(params.user_id)) :
          of(user),
        (o, visitedUser) => ({ ...o, visitedUser })
      )
    )
      .subscribe(
        ({ user, visitedUser }) => {
          this.user = user;
          this.visitedUser = visitedUser;
          this.setPageData();
        },
        ({ user }) => !!user && this.pageData.userId === -1 ?
          this.router.navigate(["profile", user.id.toString()], { queryParamsHandling: "merge", replaceUrl: true }) :
          this.onUserFail()
      );
  }

  // Установить параметры страницы
  private setPageData(): void {
    // Мой дневник
    if (!!this.user && !!this.visitedUser && this.user.id === this.visitedUser.id) {
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
    else if (!!this.visitedUser && this.user?.id !== this.visitedUser.id) {
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
      if (!!this.user) {
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
      this.menuAvatarIcon = "content_paste_search";
      // Готово
      this.ready = true;
    }
    // Готово к загрузке
    this.changeDetectorRef.detectChanges();
    this.search();
  }

  // Загрузка списка сновидений
  search(): void {
    this.loading = true;
    this.changeDetectorRef.detectChanges();
    this.titleService.setTitle(this.pageTitle);
    // Поиск по сновидениям
    const search: SearchDream = {
      page: this.pageCurrent > 0 ? this.pageCurrent : 1,
      user: this.visitedUser?.id ?? 0,
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

  // Показать фильтры
  openSearch(): void {
    this.searchPanel?.openPanel();
  }
}
