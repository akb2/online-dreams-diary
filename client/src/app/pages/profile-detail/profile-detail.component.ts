import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AppComponent } from '@app/app.component';
import { User } from '@_models/account';
import { RouteData, SimpleObject } from '@_models/app';
import { BackgroundImageData } from '@_models/appearance';
import { BackgroundImageDatas } from '@_datas/appearance';
import { Dream } from '@_models/dream';
import { DreamPlural } from '@_datas/dream';
import { NavMenuType } from '@_models/nav-menu';
import { AccountService } from '@_services/account.service';
import { DreamService } from '@_services/dream.service';
import { filter, map, mergeMap, of, Subject, switchMap, takeUntil, throwError } from 'rxjs';





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
  ready: boolean = false;
  dreamsLoading: boolean = false;

  title: string = "Общий дневник";
  subTitle: string = "Все публичные сновидения";
  private pageTitle: string;
  backgroundImageData: BackgroundImageData = BackgroundImageDatas.find(d => d.id === 1);
  navMenuType: NavMenuType = NavMenuType.short;
  menuAvatarImage: string = "";
  menuAvatarIcon: string = "";
  floatButtonIcon: string;
  floatButtonLink: string;
  backButtonLink: string;

  user: User;
  visitedUser: User;
  dreams: Dream[];

  dreamsCount: number = 0;

  navMenuTypes: typeof NavMenuType = NavMenuType;

  dreamPlural: SimpleObject = DreamPlural;

  private destroy$: Subject<void> = new Subject<void>();





  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private accountService: AccountService,
    private titleService: Title,
    private dreamService: DreamService
  ) { }

  ngOnInit() {
    this.pageData = AppComponent.getPageData(this.activatedRoute.snapshot);
    // Текущий пользователь и параметры URL
    this.defineData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Ошибка подписки на пользователя
  private onUserFail(): void {
    this.router.navigate(["404"]);
  }

  // После успешной загрузки сведений о пользователе
  private onUserLoaded(): void {
    // Загрузить сновидения
    this.loadDreams();
  }





  // Определить данные
  private defineData(): void {
    this.accountService.user$.pipe(
      takeUntil(this.destroy$),
      switchMap(user => this.pageData.userId === -1 ? throwError({ user }) : of({ user })),
      mergeMap(() => this.activatedRoute.params, (o, params) => ({ ...o, params })),
      filter(({ params }) => !!params),
      switchMap(r => parseInt(r.params.user_id) > 0 && !isNaN(r.params.user_id) ? of(r) : throwError(r)),
      map(o => ({ ...o, userId: parseInt(o.params.user_id) })),
      map(o => ({ ...o, isCurrentUser: !((!!o.user && o.user.id !== o.userId) || (!o.user && this.pageData.userId === -2)) })),
      mergeMap(
        ({ userId, isCurrentUser }) => isCurrentUser ? of(true) : this.accountService.checkPrivate("myPage", userId),
        (o, hasAccess) => ({ ...o, hasAccess })
      ),
      mergeMap(
        ({ user, userId, isCurrentUser }) => isCurrentUser ? of(user) : this.accountService.getUser(userId, ["8101"]),
        (o, visitedUser) => ({ ...o, visitedUser })
      )
    )
      .subscribe(
        ({ user, visitedUser, hasAccess }) => {
          this.userHasAccess = hasAccess;
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
    // Мой профиль
    if (this.user?.id === this.visitedUser.id) {
      this.visitedUser = this.user;
      this.title = this.user.name + " " + this.user.lastName;
      this.subTitle = this.user.pageStatus;
      this.pageTitle = AppComponent.createTitle("Моя страница");
      this.backgroundImageData = this.user.settings.profileBackground;
      this.menuAvatarImage = this.user.avatars.middle;
      this.navMenuType = this.user.settings.profileHeaderType;
      this.menuAvatarIcon = "person";
      this.floatButtonIcon = "book";
      this.floatButtonLink = "/diary/" + this.user.id;
      // Готово
      this.ready = true;
      this.itsMyPage = true;
    }
    // Профиль другого пользователя
    else {
      // Страница доступна
      if (this.userHasAccess) {
        this.subTitle = this.visitedUser.pageStatus;
        this.backgroundImageData = this.visitedUser.settings.profileBackground;
        this.navMenuType = this.visitedUser.settings.profileHeaderType;
      }
      // Скрыто настройками приватности
      else {
        this.subTitle = "";
        this.backgroundImageData = BackgroundImageDatas.find(({ id }) => id === 1);
        this.navMenuType = NavMenuType.collapse;
      }
      // Общие настройки
      this.title = this.visitedUser.name + " " + this.visitedUser.lastName;
      this.pageTitle = AppComponent.createTitle(this.title);
      this.menuAvatarImage = this.visitedUser.avatars.middle;
      this.menuAvatarIcon = "person";
      // Готово
      this.ready = true;
      this.itsMyPage = false;
    }
    // Готово к загрузке
    if (this.ready) {
      this.titleService.setTitle(this.pageTitle);
      this.changeDetectorRef.detectChanges();
      // Прочие действия
      this.onUserLoaded();
    }
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
