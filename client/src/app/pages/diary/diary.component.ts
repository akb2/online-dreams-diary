import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { PaginateEvent } from "@_controlers/pagination/pagination.component";
import { SearchPanelComponent } from "@_controlers/search-panel/search-panel.component";
import { ObjectToUrlObject } from "@_datas/api";
import { BackgroundImageDatas } from "@_datas/appearance";
import { DreamPlural, DreamStatuses } from "@_datas/dream";
import { CheckInRange, ParseInt } from "@_helpers/math";
import { CompareObjects } from "@_helpers/objects";
import { User } from "@_models/account";
import { ExcludeUrlObjectValues } from "@_models/api";
import { CustomObject, CustomObjectKey, RouteData, SimpleObject } from "@_models/app";
import { BackgroundImageData } from "@_models/appearance";
import { Dream, DreamStatus, SearchDream } from "@_models/dream";
import { OptionData } from "@_models/form";
import { Friend, FriendStatus } from "@_models/friend";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { CanonicalService } from "@_services/canonical.service";
import { DreamService } from "@_services/dream.service";
import { FriendService } from "@_services/friend.service";
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
  friend: Friend;
  dreams: Dream[];
  dreamsCount: number = 0;

  pageCurrent: number = 1;
  pageLimit: number = 12;
  private pageCount: number = 1;

  isMobile: boolean = false;
  userHasAccess: boolean = false;
  private queryParams: SimpleObject = {};
  navMenuType: typeof NavMenuType = NavMenuType;

  dreamPlural: SimpleObject = DreamPlural;

  searchForm: FormGroup;
  dreamStatuses: OptionData[] = [];

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

  // Данные поиска
  private get getSearch(): Partial<SearchDream> {
    const page: number = this.pageCurrent > 0 ? this.pageCurrent : 1;
    const fromForm: CustomObjectKey<keyof SearchDream, string | number> = Object.entries(this.getDefaultSearch)
      .filter(([k]) => k !== "page")
      .reduce((o, [k]) => ({ ...o, [k]: this.searchForm.get(k)?.value?.toString() ?? "" }), {});
    // Вернуть данные
    return {
      ...fromForm,
      status: this.getDreamStatusesFieldAvail ? (ParseInt(fromForm.status) ?? -1) : -1,
      withMap: !!fromForm.withMap && fromForm.withMap !== "false",
      withText: !!fromForm.withText && fromForm.withText !== "false",
      page,
      user: this.visitedUser?.id ?? 0,
      limit: this.pageLimit
    };
  }

  // Текущие данные из URL
  private get getCurrentSearch(): Partial<SearchDream> {
    const page: number = parseInt(this.queryParams.page) > 0 ? parseInt(this.queryParams.page) : 1;
    const fromForm: CustomObjectKey<keyof SearchDream, string | number> = Object.entries(this.getDefaultSearch)
      .filter(([k]) => k !== "page")
      .reduce((o, [k, defaultValue]) => ({ ...o, [k]: this.queryParams[k]?.toString() ?? defaultValue }), {});
    // Вернуть данные
    return {
      q: fromForm.q.toString() ?? "",
      status: this.getDreamStatusesFieldAvail ? (ParseInt(fromForm.status) ?? -1) : -1,
      withMap: !!fromForm.withMap && fromForm.withMap !== "false",
      withText: !!fromForm.withText && fromForm.withText !== "false",
      page
    };
  }

  // Пустые данные
  private get getDefaultSearch(): Partial<SearchDream> {
    return {
      q: "",
      status: -1,
      withMap: false,
      withText: false,
      page: 1
    };
  }

  // Задействован поиск
  get getIsSearch(): boolean {
    return !CompareObjects(this.getDefaultSearch, this.getCurrentSearch);
  }

  // Список поисковых фраз
  get getSearchWords(): string[] {
    const search: string = this.getCurrentSearch?.q ?? "";
    // Вернуть значение
    return !!search ? search.split(" ").filter(w => !!w) : [];
  }

  // Проверка доступности фильтра по статусам
  get getDreamStatusesFieldAvail(): boolean {
    return this.dreamStatuses?.length > 2;
  }

  // Значения для URl подлежащие сключению
  private get getExcludeParams(): ExcludeUrlObjectValues {
    return {
      page: [0, 1],
      limit: true,
      status: [-1],
      withMap: [false],
      withText: [false],
      user: true
    };
  }





  constructor(
    private accountService: AccountService,
    private activatedRoute: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef,
    private dreamService: DreamService,
    private friendService: FriendService,
    private titleService: Title,
    private router: Router,
    private globalService: GlobalService,
    private formBuilder: FormBuilder,
    private canonicalService: CanonicalService
  ) {
    this.searchForm = this.formBuilder.group(Object.entries(this.getDefaultSearch)
      .filter(([k]) => k !== "page")
      .reduce((o, [k, v]) => ({ ...o, [k]: [v, null] }), {})
    );
  }

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
      // Заголовок вкладки
      pageTitle = this.globalService.createTitle("Мой дневник сновидений");
    }
    // Дневник другого пользователя
    else if (!this.itsAllPage) {
      pageTitle = this.globalService.createTitle([this.subTitle, this.title]);
    }
    // Общий дневник
    else {
      this.title = "Общий дневник";
      this.subTitle = "Все публичные сновидения";
      this.floatButtonIcon = !!this.user ? "add" : "";
      this.floatButtonLink = !!this.user ? "/diary/editor" : "";
      this.menuAvatarIcon = "content_paste_search";
      // Заголовок вкладки
      pageTitle = this.globalService.createTitle("Общий дневник");
    }
    // Готово к загрузке
    this.pageLoading = false;
    this.titleService.setTitle(pageTitle);
    this.defineDreamStatuses();
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
    this.pageCurrent = event.pageCurrent;
    // Изменить URL
    this.urlSet(this.getSearch);
  }

  // Событие поиска
  onSearch(): void {
    this.urlSet(this.getSearch);
  }

  // Сбросить поиск
  onClear(): void {
    this.urlSet(this.getDefaultSearch);
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
        this.queryParams = queryParams;
        this.pageCurrent = CheckInRange(ParseInt(queryParams?.page), Infinity, 1);
        this.visitedUserId = visitedUserId;
        this.itsMyPage = visitedUserId > 0 && visitedUserId === this.user?.id;
        this.itsAllPage = visitedUserId === 0;
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
              .pipe(
                takeUntil(this.destroyed$),
                concatMap(
                  visitedUser => !!this.user ? this.friendService.friends$(this.user.id, visitedUser.id) : of(null),
                  (visitedUser, friend) => ({ visitedUser, friend })
                )
              )
              .subscribe(({ friend }) => {
                visitedUserSync = true;
                this.friend = friend;
              });
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
      .pipe(
        takeUntil(this.destroyed$),
        concatMap(() => this.activatedRoute.queryParams)
      )
      .subscribe(() => this.search());
  }

  // Определение доступных статусов для определения
  private defineDreamStatuses(): void {
    const isFriend: boolean = this.friend?.status === FriendStatus.Friends || this.friend?.status === FriendStatus.InSubscribe;
    const dreamStatuses: OptionData[] = [AllDreamStatuses, ...DreamStatuses];
    const availAllUnAuth: (-1 | DreamStatus)[] = [-1, DreamStatus.public];
    const availAllAuth: (-1 | DreamStatus)[] = [...availAllUnAuth, DreamStatus.users];
    const availFriend: (-1 | DreamStatus)[] = [...availAllAuth, DreamStatus.friends];
    const availMy: (-1 | DreamStatus)[] = [...availFriend, DreamStatus.draft, DreamStatus.hash, DreamStatus.private];
    const availStatuses: (-1 | DreamStatus)[] = this.itsMyPage ?
      availMy : this.itsAllPage ?
        (!!this.user ? availAllAuth : availAllUnAuth) :
        (!!this.user ? (isFriend ? availFriend : availAllAuth) : availAllUnAuth);
    // Фильтрация опций
    if (dreamStatuses.length > 2) {
      this.dreamStatuses = availStatuses
        .map(status => dreamStatuses.find(({ key }) => key === status.toString()))
        .filter(s => !!s)
        .map(status => ({ ...status, subTitle: "" }));
    }
    // Наполнить форму
    Object.entries(this.getCurrentSearch)
      .filter(([k]) => k !== "page")
      .forEach(([k, v]) => this.searchForm.get(k)?.setValue(v));
    // Проверка текущего значения
    const currentStatus: -1 | DreamStatus = ParseInt(this.searchForm.get("status")?.value);
    this.searchForm.get("status")?.setValue(this.dreamStatuses.some(({ key }) => key === currentStatus.toString()) ? currentStatus : -1);
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Загрузка списка сновидений
  search(): void {
    this.loading = true;
    this.changeDetectorRef.detectChanges();
    // Запрос
    console.log(this.getSearch);
    this.dreamService.search(this.getSearch, ["0002"])
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        ({ result, count, limit, hasAccess }) => {
          const subPage: string = this.itsMyPage ? this.user.id.toString() : (this.itsAllPage ? "all" : this.visitedUser.id.toString());
          // Отметка доступа
          this.canonicalService.setURL("diary/" + subPage, this.getSearch, this.getExcludeParams);
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

  // Записать параметры в URL
  private urlSet(datas: Partial<SearchDream>): void {
    const path: string[] = (this.router.url.split("?")[0]).split("/").filter(v => v.length > 0);
    const queryParams: CustomObject<string | number> = Object.entries(ObjectToUrlObject({ ...this.queryParams, ...datas }, "", this.getExcludeParams))
      .map(([k, v]) => ([k, !!v ? v : null]))
      .reduce((o, [k, v]) => ({ ...o, [k as string]: v }), {});
    // Перейти к новой странице
    this.router.navigate(path, {
      queryParams,
      queryParamsHandling: "merge",
      replaceUrl: true,
      state: {
        changeTitle: false,
        showPreLoader: false
      }
    });
  }
}





// Все типы сновидений
const AllDreamStatuses: OptionData = {
  key: "-1",
  icon: "widgets",
  iconColor: "disabled",
  title: "Любой уровень",
};
