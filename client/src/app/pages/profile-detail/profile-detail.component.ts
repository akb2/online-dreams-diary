import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { BackgroundImageDatas } from '@_datas/appearance';
import { ParseInt } from '@_helpers/math';
import { User, UserSex } from '@_models/account';
import { Search } from '@_models/api';
import { RouteData } from '@_models/app';
import { BackgroundImageData } from '@_models/appearance';
import { FriendListMixedResopnse, FriendSearch, FriendSearchType, FriendWithUsers } from '@_models/friend';
import { NavMenuType } from '@_models/nav-menu';
import { AccountService } from '@_services/account.service';
import { CanonicalService } from '@_services/canonical.service';
import { FriendService } from '@_services/friend.service';
import { GlobalService } from '@_services/global.service';
import { catchError, concatMap, map, Observable, of, skipWhile, Subject, switchMap, takeUntil, takeWhile, throwError, timer } from 'rxjs';





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
  pageLoading: boolean = false;
  private userReady: boolean = false;

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
  friendListLimit: number = 4;

  user: User;
  visitedUser: User;
  friends: FriendList[];

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

  // Подписка на ожидание данных0
  private waitObservable(callback: () => boolean): Observable<void> {
    return timer(1, 50).pipe(
      takeUntil(this.destroyed$),
      takeWhile(callback, true),
      skipWhile(callback),
      map(() => { })
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
    private datePipe: DatePipe,
    private canonicalService: CanonicalService
  ) { }

  ngOnInit() {
    this.pageData = this.globalService.getPageData;
    // Запуск определения данных
    this.defineCurrentUser();
    this.defineUrlParams();
    this.defineVisitingUser();
    this.defineFriendList();
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
    this.canonicalService.setURL("profile/" + this.visitedUser.id);
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
    this.waitObservable(() => !this.userReady)
      .pipe(
        concatMap(() => this.activatedRoute.params),
        switchMap(params => {
          if (params?.user_id === "0") {
            this.router.navigate(["/profile/" + this.user.id], { replaceUrl: true });
            return throwError("");
          }
          // Определить ID просматриваемого пользователя
          else {
            return of(ParseInt(params?.user_id, !!this.user ? this.user.id : 0));
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
    this.waitObservable(() => this.visitedUserId === -1 || !this.userReady)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
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
              concatMap(() => !!this.user ? this.friendService.getFriendStatus(this.visitedUserId) : of(null))
            )
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
      });
  }

  // Определение списка друзей
  private defineFriendList(): void {
    const emptyList: Search<FriendWithUsers> = { count: 0, limit: this.friendListLimit, result: [] };
    const emptyLists: FriendListMixedResopnse = { friends: emptyList, subscribe: emptyList, subscribers: emptyList };
    // Подписка
    timer(0, 50)
      .pipe(
        takeUntil(this.destroyed$),
        takeWhile(() => !this.visitedUser, true),
        skipWhile(() => !this.visitedUser),
        concatMap(() => this.itsMyPage ? of(true) : this.friendService.friends$(this.visitedUser.id, 0)),
        map(() => ({
          search: {
            user: this.visitedUser.id,
            type: "mixed",
            limit: this.friendListLimit
          } as Partial<FriendSearch>
        })),
        concatMap(({ search }) => this.friendService.getMixedList(search, ["0002", "8100"])),
        catchError(() => of(emptyLists))
      )
      .subscribe((data: any) => {
        this.friends = Object.entries(data as FriendListMixedResopnse).map(([type, { result, count }]) => ({
          type: type as FriendSearchType,
          count,
          users: result.map(({ inUser, outUser }) => inUser.id === this.visitedUser.id ? outUser : inUser)
        }));
        // Обновить
        this.changeDetectorRef.detectChanges();
      });
  }
}





// Список данных для пользователя
interface FriendList {
  type: FriendSearchType;
  users: User[];
  count: number;
}
