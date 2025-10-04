import { NavMenuComponent } from "@_controlers/nav-menu/nav-menu.component";
import { BackgroundImageDatas } from "@_datas/appearance";
import { ParseInt } from "@_helpers/math";
import { WaitObservable } from "@_helpers/rxjs";
import { User } from "@_models/account";
import { SearchResponce } from "@_models/api";
import { RouteData } from "@_models/app";
import { BackgroundImageData } from "@_models/appearance";
import { CommentMaterialType } from "@_models/comment";
import { FriendListMixedResopnse, FriendSearch, FriendSearchType, FriendWithUsers } from "@_models/friend";
import { NavMenuType } from "@_models/nav-menu";
import { ScreenKeys, ScrollData } from "@_models/screen";
import { AccountService } from "@_services/account.service";
import { CanonicalService } from "@_services/canonical.service";
import { FriendService } from "@_services/friend.service";
import { GlobalService } from "@_services/global.service";
import { ScreenService } from "@_services/screen.service";
import { ScrollService } from "@_services/scroll.service";
import { clamp } from "@akb2/math";
import { AfterContentChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { Subject, catchError, concatMap, map, merge, mergeMap, of, skipWhile, switchMap, takeUntil, takeWhile, throwError, timer } from "rxjs";
import { CommentBlockComponent } from "./comment-block/comment-block.component";





@Component({
  selector: "app-profile-detail",
  templateUrl: "./profile-detail.component.html",
  styleUrls: ["./profile-detail.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileDetailComponent implements OnInit, AfterContentChecked, OnDestroy {


  @ViewChild("mainMenu", { read: NavMenuComponent }) private mainMenu: NavMenuComponent;
  @ViewChild("leftPanel", { read: ElementRef }) private leftPanel: ElementRef;
  @ViewChild("leftPanelHelper", { read: ElementRef }) private leftPanelHelper: ElementRef;
  @ViewChild("informationElm", { read: ElementRef }) private informationElm: ElementRef;
  @ViewChild("dreamListElm", { read: ElementRef }) private dreamListElm: ElementRef;
  @ViewChild("commentListElm", { read: CommentBlockComponent }) private commentListElm: CommentBlockComponent;

  imagePrefix: string = "/assets/images/backgrounds/";
  pageData: RouteData;

  isAutorizedUser: boolean = false;
  itsMyPage: boolean = false;
  userHasAccess: boolean = false;
  pageLoading: boolean = false;
  private userReady: boolean = false;
  showDreamsList: boolean = false;

  title: string = "Страница пользователя";
  private pageTitle: string;
  backgroundImageData: BackgroundImageData = BackgroundImageDatas.find(d => d.id === 1);
  navMenuType: NavMenuType = NavMenuType.short;
  menuAvatarImage: string = "";
  menuAvatarIcon: string = "";
  menuAvatarBlink: boolean = false;
  floatButtonIcon: string;
  floatButtonLink: string;
  backButtonLink: string;
  materialType: CommentMaterialType = CommentMaterialType.Profile;

  private visitedUserId: number = -1;
  friendListLimit: number = 4;
  private beforeScroll: number = 0;
  leftPanelHelperShift: number = 0;

  private breakpoint: ScreenKeys = "default";
  private mobileBreakpoints: ScreenKeys[] = ["xsmall", "xxsmall"];

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

  // Плейсхолдер стены
  getWallPlaceholder(name: string): string {
    return this.itsMyPage ?
      "Напишите, что у вас нового . . ." :
      "Напишите " + name + " что у вас нового . . .";
  }

  // Подзаголовок стены без записей
  getWallEmptySubTitle(name: string): string {
    return this.itsMyPage
      ? "pages.profile.blocks.comments.no_comments.my_wall.sub_title"
      : !!this.user?.id
        ? this.translateService.instant("pages.profile.blocks.comments.no_comments.another_user.sub_title", { name })
        : "pages.profile.blocks.comments.no_comments.no_auth.sub_title";
  }

  // Показывать статус
  private get showStatus(): boolean {
    return !!this.visitedUser?.pageStatus?.length || this.itsMyPage;
  }

  // Показывать статус на телефоне
  get showDesktopStatus(): boolean {
    return this.showStatus && !this.mobileBreakpoints.includes(this.breakpoint);
  }

  // Показывать статус на телефоне
  get showMobileStatus(): boolean {
    return this.showStatus && this.mobileBreakpoints.includes(this.breakpoint);
  }





  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private screenService: ScreenService,
    private scrollService: ScrollService,
    private accountService: AccountService,
    private friendService: FriendService,
    private titleService: Title,
    private globalService: GlobalService,
    private translateService: TranslateService,
    private canonicalService: CanonicalService
  ) { }

  ngOnInit() {
    this.pageData = this.globalService.getPageData;
    // Прокрутка левой колонки
    WaitObservable(() => !this.leftPanel?.nativeElement || !this.leftPanelHelper?.nativeElement || !this.informationElm?.nativeElement)
      .pipe(
        map(() => ({ elm: this.leftPanel.nativeElement, elmHelper: this.leftPanelHelper.nativeElement })),
        mergeMap(({ elm, elmHelper }) => merge(
          this.scrollService.onAlwaysScroll(),
          this.screenService.elmResize([elm, elmHelper]).pipe(
            map(() => this.scrollService.getCurrentScroll)
          )
        )),
        takeUntil(this.destroyed$)
      )
      .subscribe(scrollData => this.onLeftPanelPosition(scrollData));
    // Изменения брейкпоинта
    this.screenService.breakpoint$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(breakpoint => {
        this.breakpoint = breakpoint;
        this.onLeftPanelPosition(this.scrollService.getCurrentScroll);
        this.changeDetectorRef.detectChanges();
      });
    // Запуск определения данных
    this.defineCurrentUser();
    this.defineUrlParams();
    this.defineVisitingUser();
    this.defineFriendList();
  }

  ngAfterContentChecked(): void {
    this.showDreamsList = !!(this.dreamListElm?.nativeElement as HTMLElement)?.children?.length;
    this.changeDetectorRef.detectChanges();
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
      this.menuAvatarIcon = "person";
      this.menuAvatarImage = this.visitedUser.avatars.middle;
      this.backgroundImageData = this.visitedUser.settings.profileBackground;
      this.navMenuType = this.visitedUser.settings.profileHeaderType;
      this.menuAvatarBlink = this.visitedUser.online;
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

  // Посчитать смещение левой колонки
  private onLeftPanelPosition({ elm: scrollElm, y: scrollY, lastScrollAddedY }: ScrollData): void {
    if (!!this.leftPanel?.nativeElement && !!this.leftPanelHelper?.nativeElement && this.breakpoint !== "xsmall" && this.breakpoint !== "xxsmall") {
      const elm: HTMLElement = this.leftPanel.nativeElement;
      const elmHelper: HTMLElement = this.leftPanelHelper.nativeElement;
      const elmInformation: HTMLElement = this.informationElm.nativeElement;
      const spacing: number = ParseInt(getComputedStyle(elmInformation).rowGap);
      const mainMenuHeight: number = this.mainMenu.headerHeight;
      const elmHeight: number = elm.clientHeight;
      const elmHelperHeight: number = elmHelper.clientHeight;
      const headerShift: number = mainMenuHeight + spacing;
      const screenHeight: number = scrollElm.clientHeight - headerShift - spacing;
      const availShift: boolean = elmHelperHeight < elmHeight;
      const maxShift: number = elmHelperHeight - screenHeight - headerShift;
      const scrollShift: number = scrollY - this.beforeScroll;
      // Если отступ допустим
      if (lastScrollAddedY === 0) {
        this.leftPanelHelperShift = availShift && elmHelperHeight > screenHeight ?
          -clamp(scrollShift - this.leftPanelHelperShift, maxShift, -headerShift) :
          headerShift;
      }
      // Обновить
      this.beforeScroll = scrollY;
      this.changeDetectorRef.detectChanges();
    }
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
    WaitObservable(() => !this.userReady)
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
        }),
        takeUntil(this.destroyed$)
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
    WaitObservable(() => this.visitedUserId === -1 || !this.userReady)
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
              concatMap(() => !!this.user ? this.friendService.getFriendStatus(this.visitedUserId) : of(null)),
              takeUntil(this.destroyed$)
            )
            .subscribe(() => visitedUserSync = true);
        }
        // Подписка
        WaitObservable(() => !visitedUserSync)
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
    const emptyList: SearchResponce<FriendWithUsers> = { count: 0, limit: this.friendListLimit, result: [] };
    const emptyLists: FriendListMixedResopnse = { friends: emptyList, subscribe: emptyList, subscribers: emptyList };
    // Подписка
    timer(0, 50)
      .pipe(
        takeWhile(() => !this.visitedUser, true),
        skipWhile(() => !this.visitedUser),
        concatMap(() => this.itsMyPage || !this.isAutorizedUser ? of(true) : this.friendService.friends$(this.visitedUser.id, 0)),
        map(() => ({
          search: {
            user: this.visitedUser.id,
            type: "mixed",
            limit: this.friendListLimit
          } as Partial<FriendSearch>
        })),
        concatMap(({ search }) => this.friendService.getMixedList(search, ["0002", "8100"])),
        catchError(() => of(emptyLists)),
        takeUntil(this.destroyed$)
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
