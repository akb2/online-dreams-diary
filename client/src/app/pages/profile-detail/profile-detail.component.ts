import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { BackgroundImageDatas } from '@_datas/appearance';
import { DreamPlural } from '@_datas/dream';
import { User } from '@_models/account';
import { Search } from '@_models/api';
import { RouteData, SimpleObject } from '@_models/app';
import { BackgroundImageData } from '@_models/appearance';
import { Dream } from '@_models/dream';
import { NavMenuType } from '@_models/nav-menu';
import { ScreenBreakpoints } from '@_models/screen';
import { AccountService } from '@_services/account.service';
import { DreamService } from '@_services/dream.service';
import { GlobalService } from '@_services/global.service';
import { ScreenService } from '@_services/screen.service';
import { filter, map, mergeMap, of, skipWhile, Subject, switchMap, takeUntil, takeWhile, throwError, timer } from 'rxjs';





@Component({
  selector: 'app-profile-detail',
  templateUrl: './profile-detail.component.html',
  styleUrls: ['./profile-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileDetailComponent implements OnInit, OnDestroy {


  imagePrefix: string = "../../../../assets/images/backgrounds/";
  pageData: RouteData;

  itsMyPage: boolean = false;
  userHasAccess: boolean = false;
  userHasDiaryAccess: boolean = false;
  private userReady: boolean = false;

  pageLoading: boolean = false;
  dreamsLoading: boolean = false;

  title: string = "Страница пользователя";
  subTitle: string = "";
  private pageTitle: string;
  backgroundImageData: BackgroundImageData = BackgroundImageDatas.find(d => d.id === 1);
  navMenuType: NavMenuType = NavMenuType.short;
  menuAvatarImage: string = "";
  menuAvatarIcon: string = "";
  floatButtonIcon: string;
  floatButtonLink: string;
  backButtonLink: string;

  private visitedUserId: number = -1;

  private user: User;
  visitedUser: User;
  dreams: Dream[];

  dreamsCount: number = 0;

  navMenuTypes: typeof NavMenuType = NavMenuType;

  dreamPlural: SimpleObject = DreamPlural;

  private destroy$: Subject<void> = new Subject<void>();





  // У пользователя есть аватарка
  get getVisitedUserHasAvatar(): boolean {
    return (
      !!this.visitedUser &&
      !!this.visitedUser.avatars &&
      !!this.visitedUser.avatars.full &&
      !!this.visitedUser.avatars.middle &&
      !!this.visitedUser.avatars.crop &&
      !!this.visitedUser.avatars.small
    );
  }





  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private accountService: AccountService,
    private screenService: ScreenService,
    private titleService: Title,
    private dreamService: DreamService,
    private globalService: GlobalService
  ) { }

  ngOnInit() {
    this.pageData = this.globalService.getPageData;
    // Запуск определения данных
    this.defineCurrentUser();
    this.defineUrlParams();
    this.defineVisitingUser();
    this.defineDreams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Ошибка подписки на пользователя
  private onUserFail(): void {
    this.router.navigate(["404"]);
  }

  // Все данные загружены
  private onUserLoaded(): void {
    // Мой профиль
    if (!!this.user && !!this.visitedUser && this.user.id === this.visitedUser.id) {
      this.visitedUser = this.user;
      this.title = this.user.name + " " + this.user.lastName;
      // this.subTitle = this.user.pageStatus;
      this.pageTitle = this.globalService.createTitle("Моя страница");
      this.backgroundImageData = this.user.settings.profileBackground;
      this.menuAvatarImage = this.user.avatars.middle;
      this.navMenuType = this.user.settings.profileHeaderType;
      this.menuAvatarIcon = "person";
      this.floatButtonIcon = "book";
      this.floatButtonLink = "/diary/" + this.user.id;
    }
    // Профиль другого пользователя
    else if (!!this.visitedUser) {
      // Страница доступна
      if (this.userHasAccess) {
        // this.subTitle = this.visitedUser.pageStatus;
        this.backgroundImageData = this.visitedUser.settings.profileBackground;
        this.navMenuType = this.visitedUser.settings.profileHeaderType;
      }
      // Скрыто настройками приватности
      else {
        // this.subTitle = "";
        this.backgroundImageData = BackgroundImageDatas.find(({ id }) => id === 1);
        this.navMenuType = NavMenuType.collapse;
      }
      // Общие настройки
      this.title = this.visitedUser.name + " " + this.visitedUser.lastName;
      this.pageTitle = this.globalService.createTitle(this.title);
      this.menuAvatarImage = this.visitedUser.avatars.middle;
      this.menuAvatarIcon = "person";
    }
    // Готово к загрузке
    this.pageLoading = false;
    this.titleService.setTitle(this.pageTitle);
    this.changeDetectorRef.detectChanges();
  }





  // Определение текущего пользователя
  private defineCurrentUser(): void {
    this.pageLoading = true;
    this.changeDetectorRef.detectChanges();
    // Подписка
    this.accountService.user$()
      .pipe(takeUntil(this.destroy$))
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
    timer(0, 50)
      .pipe(
        takeUntil(this.destroy$),
        takeWhile(() => !this.userReady, true),
        skipWhile(() => !this.userReady),
        mergeMap(() => this.activatedRoute.params),
        switchMap(params => {
          if (params?.user_id === "0") {
            this.router.navigate(["/profile/" + this.user.id], { replaceUrl: true });
            return throwError("");
          }
          // Определить ID просматриваемого пользователя
          else {
            let userId: number = parseInt(params?.user_id);
            userId = isNaN(userId) ? (!!this.user ? this.user.id : 0) : userId;
            return of(userId);
          }
        })
      )
      .subscribe(visitedUserId => {
        this.visitedUserId = visitedUserId;
        this.itsMyPage = visitedUserId === this.user?.id;
        this.changeDetectorRef.detectChanges();
      });
  }

  // Определение просматриваемого пользователя
  private defineVisitingUser(): void {
    this.pageLoading = true;
    this.changeDetectorRef.detectChanges();
    // Подписка на данные пользователя
    timer(0, 50)
      .pipe(
        takeUntil(this.destroy$),
        takeWhile(() => this.visitedUserId === -1, true),
        skipWhile(() => this.visitedUserId === -1),
        mergeMap(() => this.itsMyPage ? of(true) : this.accountService.checkPrivate("myPage", this.visitedUserId, ["8100"])),
        mergeMap(
          () => this.accountService.user$(this.visitedUserId, !this.itsMyPage),
          (userHasAccess, user) => ({ userHasAccess, user })
        )
      )
      .subscribe(
        ({ userHasAccess, user }) => {
          this.visitedUser = user;
          this.userHasAccess = userHasAccess;
          this.onUserLoaded();
        },
        () => this.onUserFail()
      );
  }

  // Загрузить список сновидний
  private defineDreams(): void {
    const defaultDreamsResult: Search<Dream> = { count: 0, result: [], limit: 1 };
    const limits: Partial<ScreenBreakpoints> = {
      default: 1,
      xlarge: 4,
      large: 3,
      middle: 2
    };
    let prevLimit: number = limits.default;
    // Настройки
    this.dreamsLoading = true;
    // Поиск сновидений
    timer(0, 50)
      .pipe(
        takeUntil(this.destroy$),
        takeWhile(() => !this.visitedUser, true),
        skipWhile(() => !this.visitedUser),
        mergeMap(() => this.screenService.breakpoint$),
        map(breakPoint => limits[breakPoint] ?? limits.default),
        filter(limit => {
          if (limit !== prevLimit) {
            prevLimit = limit;
            // Запустить загрузчик
            this.dreamsLoading = true;
            this.changeDetectorRef.detectChanges();
            // Обновить
            return true;
          }
          // Не обновлять
          return false;
        }),
        filter(() => this.userHasAccess),
        mergeMap(
          () => this.itsMyPage ? of(true) : this.accountService.checkPrivate("myDreamList", this.visitedUser.id),
          (limit, hasAccess) => ({ limit, hasAccess })
        ),
        mergeMap(
          ({ hasAccess, limit }) => hasAccess ? this.dreamService.search({ user: this.visitedUser.id, limit }, ["0002", "8100"]) : of(defaultDreamsResult),
          ({ hasAccess }, { count, result: dreams, limit }) => ({ hasAccess, count, dreams, limit })
        ),
        switchMap(r => r.count > 0 ? of(r) : throwError(r.hasAccess))
      )
      .subscribe(
        ({ hasAccess, dreams, count }: any) => {
          this.userHasDiaryAccess = hasAccess;
          this.dreams = dreams;
          this.dreamsCount = count;
          this.dreamsLoading = false;
          this.changeDetectorRef.detectChanges();
        },
        hasAccess => {
          this.userHasDiaryAccess = hasAccess;
          this.dreams = [];
          this.dreamsCount = 0;
          this.dreamsLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      );
  }
}
