import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { BackgroundImageDatas } from '@_datas/appearance';
import { DreamPlural } from '@_datas/dream';
import { User } from '@_models/account';
import { RouteData, SimpleObject } from '@_models/app';
import { BackgroundImageData } from '@_models/appearance';
import { Dream } from '@_models/dream';
import { NavMenuType } from '@_models/nav-menu';
import { AccountService } from '@_services/account.service';
import { DreamService } from '@_services/dream.service';
import { GlobalService } from '@_services/global.service';
import { mergeMap, Observable, of, Subject, switchMap, takeUntil, throwError } from 'rxjs';





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

  private visitedUserId: number = 0;

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
    private titleService: Title,
    private dreamService: DreamService,
    private globalService: GlobalService
  ) { }

  ngOnInit() {
    this.pageData = this.globalService.getPageData;
    // Запуск определения данных
    this.defineCurrentUser();
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
    this.loadDreams();
  }





  // Определение текущего пользователя
  private defineCurrentUser(): void {
    this.pageLoading = true;
    this.changeDetectorRef.detectChanges();
    // Подписка
    this.accountService.user$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        user => {
          this.user = user;
          // Параметры URL
          this.defineUrlParams();
        }
      );
  }

  // Определение параметров URL
  private defineUrlParams(): void {
    this.pageLoading = true;
    this.changeDetectorRef.detectChanges();
    // Подписка
    this.activatedRoute.params
      .pipe(
        takeUntil(this.destroy$),
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
        // Параметры URL
        this.defineHasProfileAccess();
      });
  }

  // Определение доступа к странице
  private defineHasProfileAccess(): void {
    this.pageLoading = true;
    this.changeDetectorRef.detectChanges();
    // Параметры
    const observable: Observable<boolean> = this.itsMyPage ?
      of(true) :
      this.accountService.checkPrivate("myPage", this.visitedUserId);
    // Подписка на доступ к данным
    observable
      .pipe(takeUntil(this.destroy$))
      .subscribe(userHasAccess => {
        this.userHasAccess = userHasAccess;
        this.defineVisitingUser();
      });
  }

  // Определение просматриваемого пользователя
  private defineVisitingUser(): void {
    this.pageLoading = true;
    this.changeDetectorRef.detectChanges();
    // Параметры
    const observable: Observable<User> = this.itsMyPage ?
      of(this.user) :
      this.accountService.user$(this.visitedUserId, true);
    // Подписка на данные пользователя
    observable
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        user => {
          this.visitedUser = user;
          this.setPageData();
        },
        () => this.onUserFail()
      );
  }

  // Установить параметры страницы
  private setPageData(): void {
    // Мой профиль
    if (this.user?.id === this.visitedUser.id) {
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
    else {
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
    // Прочие действия
    this.onUserLoaded();
  }

  // Загрузить список сновидний
  private loadDreams(): void {
    const user: number = this.visitedUser.id;
    const limit: number = 4;
    // Настройки
    this.dreamsLoading = true;
    // Поиск сновидений
    (!!this.user?.id && this.user.id === user ? of(true) : this.accountService.checkPrivate("myDreamList", user))
      .pipe(
        takeUntil(this.destroy$),
        mergeMap(
          hasAccess => hasAccess ? this.dreamService.search({ user, limit }, ["0002", "8100"]) : of({ count: 0, result: [], limit: 1 }),
          (hasAccess, { count, result: dreams, limit }) => ({ hasAccess, count, dreams, limit })
        ),
        switchMap(r => r.count > 0 ? of(r) : throwError(r.hasAccess))
      )
      .subscribe(
        ({ hasAccess, dreams, count }) => {
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
