import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, ActivatedRouteSnapshot, Router } from "@angular/router";
import { AppComponent } from "@app/app.component";
import { User } from "@_models/account";
import { RouteData } from "@_models/app";
import { BackgroundImageData, BackgroundImageDatas } from "@_models/appearance";
import { Dream } from "@_models/dream";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { DreamService, SearchDream } from "@_services/dream.service";
import { Observable, of, Subject } from "rxjs";
import { takeUntil, tap } from "rxjs/operators";





@Component({
  selector: "app-diary",
  templateUrl: "./diary.component.html",
  styleUrls: ["./diary.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DiaryComponent implements OnInit, DoCheck, OnDestroy {


  imagePrefix: string = "../../../../assets/images/backgrounds/";
  pageData: RouteData;
  ready: boolean = false;
  loading: boolean = true;

  title: string = "Общий дневник";
  subTitle: string = "Все публичные сновидения";
  backgroundImageData: BackgroundImageData = BackgroundImageDatas.find(d => d.id === 11);
  menuAvatarImage: string = "";
  menuAvatarIcon: string = "";
  floatButtonIcon: string;
  floatButtonLink: string;
  backButtonLink: string;

  oldUser: User;
  visitedUser: User;
  dreams: Dream[];
  dreamsCount: number = 0;

  navMenuType: typeof NavMenuType = NavMenuType;

  private destroy$: Subject<void> = new Subject<void>();





  // Текущий пользователь
  get user(): User {
    return AppComponent.user;
  };





  constructor(
    private accountService: AccountService,
    private activatedRoute: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef,
    private dreamService: DreamService,
    private router: Router
  ) { }

  ngDoCheck() {
    if (this.accountService.checkAuth && this.oldUser?.id !== this.user?.id) {
      this.oldUser = this.user;
      this.defineData();
    }
  }

  ngOnInit() {
    let snapshots: ActivatedRouteSnapshot = this.activatedRoute.snapshot;
    while (!!snapshots.firstChild) snapshots = snapshots.firstChild;
    this.pageData = snapshots.data;
    // Пользователь не авторизован
    if (!this.accountService.checkAuth) {
      this.defineData();
    }
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
    // Обновить
    this.changeDetectorRef.detectChanges();
  }





  // Подписка на пользователя
  private subscribeUser(userId: number = this.user.id): Observable<User> {
    const observable: Observable<User> = !!userId ? this.accountService.getUser(userId) : of(null);
    // Подписка
    return observable.pipe(
      takeUntil(this.destroy$),
      tap(user => {
        if (userId > 0) {
          this.visitedUser = user;
          // Обновить
          this.changeDetectorRef.detectChanges();
        }
      })
    );
  }

  // Определить данные
  private defineData(): void {
    // Мой дневник
    if (this.pageData.userId === -1 || (this.user && this.pageData.userId === this.user.id)) {
      if (this.pageData.userId === -1) {
        this.router.navigate(["diary", this.user.id.toString()], { queryParamsHandling: "merge", replaceUrl: true });
      }
    }
    // Дневник другого пользователя
    else if (this.pageData.userId === -2 || (this.user && this.pageData.userId > 0 && this.pageData.userId !== this.user.id)) {
      this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
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
    // Общий дневник
    else {
      this.pageData.userId = 0;
      this.setPageData();
    }
  }

  // Установить параметры страницы
  private setPageData(): void {
    // Мой дневник
    if (this.pageData.userId > 0 && this.user && this.pageData.userId === this.user.id) {
      this.title = this.user.name + " " + this.user.lastName;
      this.subTitle = "Мой дневник сновидений";
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
    else if (this.pageData.userId > 0 && ((this.user && this.pageData.userId !== this.user.id) || !this.user)) {
      this.title = this.visitedUser.name + " " + this.visitedUser.lastName;
      this.subTitle = "Дневник сновидений пользователя";
      this.backgroundImageData = this.visitedUser.settings.profileBackground;
      this.menuAvatarImage = this.visitedUser.avatars.middle;
      this.menuAvatarIcon = "person";
      this.backButtonLink = "/profile/" + this.visitedUser.id;
      // Готово
      this.ready = true;
    }
    // Общий дневник
    else {
      if (this.user) {
        this.floatButtonIcon = "add";
        this.floatButtonLink = "/diary/editor";
      }
      // Для неавторизованного пользователя
      else {
        this.floatButtonIcon = "";
        this.floatButtonLink = "";
      }
      // Готово
      this.ready = true;
    }
    // Готово к загрузке
    if (this.ready) {
      this.changeDetectorRef.detectChanges();
      this.loadDreams();
    }
  }

  // Загрузка списка сновидений
  loadDreams(): void {
    this.loading = true;
    this.changeDetectorRef.detectChanges();
    // Поиск по сновидениям
    const search: SearchDream = {
      page: 1,
      user: this.pageData.userId || 0,
      status: -1
    };
    // Загрузка списка
    this.dreamService.getList(search, ["0002"]).subscribe(
      ({ count, dreams }) => {
        // Найдены сновидения
        if (count > 0) {
          this.dreamsCount = count;
          this.dreams = dreams;
          this.loading = false;
          // Обновить
          this.changeDetectorRef.detectChanges();
        }
        // Сновидения не найдены
        else {
          this.onNotDreamsFound();
        }
      },
      e => this.onNotDreamsFound()
    );
  }
}
