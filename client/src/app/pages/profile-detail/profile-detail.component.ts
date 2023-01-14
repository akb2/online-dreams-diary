import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { BackgroundImageDatas } from '@_datas/appearance';
import { User, UserSex } from '@_models/account';
import { RouteData } from '@_models/app';
import { BackgroundImageData } from '@_models/appearance';
import { NavMenuType } from '@_models/nav-menu';
import { AccountService } from '@_services/account.service';
import { FriendService } from '@_services/friend.service';
import { GlobalService } from '@_services/global.service';
import { mergeMap, of, skipWhile, Subject, switchMap, takeUntil, takeWhile, throwError, timer } from 'rxjs';





@Component({
  selector: 'app-profile-detail',
  templateUrl: './profile-detail.component.html',
  styleUrls: ['./profile-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileDetailComponent implements OnInit, OnDestroy {


  imagePrefix: string = "../../../../assets/images/backgrounds/";
  pageData: RouteData;

  isAutorizedUser: boolean = false;
  itsMyPage: boolean = false;
  userHasAccess: boolean = false;
  private userReady: boolean = false;
  pageLoading: boolean = false;

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

  user: User;
  visitedUser: User;

  navMenuTypes: typeof NavMenuType = NavMenuType;

  private destroyed$: Subject<void> = new Subject<void>();





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
    private friendService: FriendService,
    private titleService: Title,
    private globalService: GlobalService,
    private datePipe: DatePipe
  ) { }

  ngOnInit() {
    this.pageData = this.globalService.getPageData;
    // Запуск определения данных
    this.defineCurrentUser();
    this.defineUrlParams();
    this.defineVisitingUser();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Ошибка подписки на пользователя
  private onUserFail(): void {
    this.router.navigate(["404"]);
  }

  // Все данные загружены
  private onUserLoaded(): void {
    const isMyProfile: boolean = !!this.user && !!this.visitedUser && this.user.id === this.visitedUser.id;
    const isOtherProfile: boolean = !isMyProfile && !!this.visitedUser;
    // Для обоих типов просмотра
    if (isMyProfile || isOtherProfile) {
      this.title = this.visitedUser.name + " " + this.visitedUser.lastName;
      this.subTitle = this.visitedUser.online ?
        "В сети" :
        (this.visitedUser.sex === UserSex.Male ? "Был" : "Была") + " " + this.datePipe.transform(this.visitedUser.lastActionDate, "d MMMM y - H:mm");
      this.menuAvatarIcon = "person";
      this.menuAvatarImage = this.visitedUser.avatars.middle;
      this.backgroundImageData = this.visitedUser.settings.profileBackground;
      this.navMenuType = this.visitedUser.settings.profileHeaderType;
    }
    // Мой профиль
    if (isMyProfile) {
      this.pageTitle = this.globalService.createTitle("Моя страница");
      this.floatButtonIcon = "palette";
      this.floatButtonLink = "/profile/settings/appearance";
    }
    // Профиль другого пользователя
    else if (isOtherProfile) {
      // Скрыто настройками приватности
      if (!this.userHasAccess) {
        this.backgroundImageData = BackgroundImageDatas.find(({ id }) => id === 1);
        this.navMenuType = NavMenuType.collapse;
      }
      // Общие настройки
      this.pageTitle = this.globalService.createTitle(this.title);
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
      .pipe(takeUntil(this.destroyed$))
      .subscribe(user => {
        this.user = user;
        this.isAutorizedUser = !!this.user;
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
        takeUntil(this.destroyed$),
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
        takeUntil(this.destroyed$),
        takeWhile(() => this.visitedUserId === -1, true),
        skipWhile(() => this.visitedUserId === -1),
        mergeMap(() => this.accountService.user$()),
        mergeMap(() => this.itsMyPage || !this.isAutorizedUser ? of(null) : this.friendService.friends$(this.visitedUserId, 0, true)),
        mergeMap(
          () => this.itsMyPage ? of(true) : this.accountService.checkPrivate("myPage", this.visitedUserId, ["8100"]),
          (friend, userHasAccess) => ({ userHasAccess, friend })
        ),
        mergeMap(
          () => this.accountService.user$(this.visitedUserId, !this.itsMyPage),
          (data, user) => ({ ...data, user })
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
}
