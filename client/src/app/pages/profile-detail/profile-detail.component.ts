import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AppComponent } from '@app/app.component';
import { User } from '@_models/account';
import { RouteData, SimpleObject } from '@_models/app';
import { BackgroundImageData, BackgroundImageDatas } from '@_models/appearance';
import { Dream, DreamPlural } from '@_models/dream';
import { NavMenuType } from '@_models/nav-menu';
import { AccountService } from '@_services/account.service';
import { DreamService } from '@_services/dream.service';
import { filter, mergeMap, of, Subject, switchMap, takeUntil, throwError } from 'rxjs';





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
      mergeMap(({ params, user }) => (!!user && user.id !== parseInt(params.user_id)) || (!user && this.pageData.userId === -2) ?
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
      this.floatButtonIcon = "settings";
      this.floatButtonLink = "/profile/settings";
      // Готово
      this.ready = true;
      this.itsMyPage = true;
    }
    // Профиль другого пользователя
    else {
      this.title = this.visitedUser.name + " " + this.visitedUser.lastName;
      this.subTitle = this.visitedUser.pageStatus;
      this.pageTitle = AppComponent.createTitle(this.title);
      this.backgroundImageData = this.visitedUser.settings.profileBackground;
      this.navMenuType = this.visitedUser.settings.profileHeaderType;
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
    this.dreamService.search({ user, limit })
      .pipe(
        takeUntil(this.destroy$),
        switchMap(r => r.count > 0 ? of(r) : throwError("Сновидения не найдены"))
      )
      .subscribe(
        ({ result: dreams, count }) => {
          this.dreams = dreams;
          this.dreamsCount = count;
          this.dreamsLoading = false;
          this.changeDetectorRef.detectChanges();
        },
        () => {
          this.dreams = [];
          this.dreamsCount = 0;
          this.dreamsLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      );
  }
}
