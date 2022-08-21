import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AppComponent } from '@app/app.component';
import { User } from '@_models/account';
import { RouteData, SimpleObject } from '@_models/app';
import { BackgroundImageData, BackgroundImageDatas } from '@_models/appearance';
import { Dream, DreamPlural, DreamStatus } from '@_models/dream';
import { NavMenuType } from '@_models/nav-menu';
import { AccountService } from '@_services/account.service';
import { DreamService } from '@_services/dream.service';
import { Observable, of, Subject, switchMap, takeUntil, tap, throwError } from 'rxjs';





@Component({
  selector: 'app-profile-detail',
  templateUrl: './profile-detail.component.html',
  styleUrls: ['./profile-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileDetailComponent implements DoCheck, OnInit {


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

  oldUser: User;
  visitedUser: User;
  dreams: Dream[];

  dreamsCount: number = 0;

  navMenuTypes: typeof NavMenuType = NavMenuType;

  dreamPlural: SimpleObject = DreamPlural;

  private destroy$: Subject<void> = new Subject<void>();





  // Текущий пользователь
  get user(): User {
    return AppComponent.user;
  };





  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private accountService: AccountService,
    private titleService: Title,
    private dreamService: DreamService
  ) { }

  ngDoCheck() {
    if (this.oldUser?.id !== this.user?.id) {
      this.oldUser = this.user;
      this.defineData();
    }
    // Проверить заголовок
    if (this.titleService.getTitle() !== this.pageTitle) {
      this.titleService.setTitle(this.pageTitle);
    }
  }

  ngOnInit() {
    this.pageData = AppComponent.getPageData(this.activatedRoute.snapshot);
    // Пользователь не авторизован
    if (!this.accountService.checkAuth) {
      this.defineData();
    }
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





  // Подписка на пользователя
  private subscribeUser(userId: number = this.user.id): Observable<User> {
    const observable: Observable<User> = !!userId ? this.accountService.getUser(userId) : of(null);
    // Подписка
    return observable.pipe(
      takeUntil(this.destroy$),
      tap(user => userId > 0 ? this.visitedUser = user : null)
    );
  }

  // Определить данные
  private defineData(): void {
    // Мой профиль
    if (this.pageData.userId === -1 || (this.user && this.pageData.userId === this.user.id)) {
      if (this.pageData.userId === -1) {
        this.router.navigate(["profile", this.user.id.toString()], { queryParamsHandling: "merge", replaceUrl: true });
      }
    }
    // Профиль другого пользователя
    else if (this.pageData.userId === -2 || (this.user && this.pageData.userId > 0 && this.pageData.userId !== this.user.id)) {
      this.activatedRoute.params.subscribe(params => {
        this.pageData.userId = parseInt(params["user_id"]);
        // Подписка
        if (!this.user || (this.user && this.pageData.userId !== this.user.id)) {
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
    // Другое
    else {
      this.pageData.userId = 0;
      this.onUserFail();
    }
  }

  // Установить параметры страницы
  private setPageData(): void {
    // Мой профиль
    if (this.pageData.userId > 0 && this.user && this.pageData.userId === this.user.id) {
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
    else if (this.pageData.userId > 0 && ((this.user && this.pageData.userId !== this.user.id) || !this.user)) {
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
