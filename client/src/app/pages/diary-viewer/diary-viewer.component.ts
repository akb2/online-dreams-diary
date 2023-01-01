import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import "@ckeditor/ckeditor5-build-classic/build/translations/ru";
import { DreamTitle } from "@_datas/dream-map-settings";
import { User } from "@_models/account";
import { SimpleObject } from "@_models/app";
import { Dream, DreamMode } from "@_models/dream";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { DreamService } from "@_services/dream.service";
import { GlobalService } from "@_services/global.service";
import { mergeMap, of, Subject, switchMap, takeUntil, throwError } from "rxjs";





@Component({
  selector: "app-diary-viewer",
  templateUrl: "./diary-viewer.component.html",
  styleUrls: ["./diary-viewer.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DiaryViewerComponent implements OnInit, OnDestroy {


  imagePrefix: string = "../../../../assets/images/backgrounds/";
  ready: boolean = false;
  private pageTitle: string = "Просмотр сновидения";

  defaultTitle: string = DreamTitle;
  today: Date = new Date();

  _navMenuType: typeof NavMenuType = NavMenuType;

  dreamId: number = 0;
  private fromMark: string;
  dream: Dream;

  user: User;

  private destroy$: Subject<void> = new Subject<void>();





  // Кнопка назад
  get backLink(): string {
    const fromArray: string[] = this.fromMark.split("|") || [];
    const from: string = fromArray[fromArray.length - 1] || "";
    // Список всех сновидений
    if (from === "diary-all") {
      return "/diary/all";
    }
    // Из профиля
    else if (from === "profile") {
      return "/profile/" + this.dream.user.id;
    }
    // Мой дневник
    return "/diary/" + this.dream.user.id;
  }

  // Кнопка назад: параметры
  get backLinkParams(): SimpleObject {
    const fromArray: string[] = this.fromMark.split("|") || [];
    const fromMark: string = fromArray.filter((v, k) => k < fromArray.length - 1).join("|");
    // Вернуть значение
    return fromMark ? { from: fromMark } : {};
  }

  // Плавающая кнопка
  get floatButtonData(): FloatButtonData {
    const data: FloatButtonData = {
      icon: "person",
      link: "/profile/" + this.dream.user.id,
      params: {}
    };
    // Редакировать
    if (this.user?.id === this.dream.user.id) {
      data.icon = "edit";
      data.link = "/diary/editor/" + this.dream.id;
      data.params.from = this.fromMark + (this.fromMark.length > 0 ? "|" : "") + "diary-viewer";
    }
    // Вернуть данные
    return data;
  }

  // Доступен ли просмотр текста
  get isTextAvail(): boolean {
    return (this.dream.mode === DreamMode.mixed || this.dream.mode === DreamMode.text) && this.dream.text.length > 0;
  }

  // Доступен ли просмотр текста
  get isMapAvail(): boolean {
    return (this.dream.mode === DreamMode.mixed || this.dream.mode === DreamMode.map) && !!this.dream.map;
  }





  constructor(
    private activatedRoute: ActivatedRoute,
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef,
    private dreamService: DreamService,
    private router: Router,
    private titleService: Title,
    private globalService: GlobalService
  ) {
    this.dreamId = parseInt(this.activatedRoute.snapshot.params.dreamId);
    this.dreamId = isNaN(this.dreamId) ? 0 : this.dreamId;
  }

  ngOnInit() {
    this.defineData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Определить данные
  private defineData(): void {
    this.accountService.user$()
      .pipe(
        takeUntil(this.destroy$),
        mergeMap(
          () => this.activatedRoute.queryParams,
          (user, params) => ({ user, params })
        ),
        mergeMap(
          () => this.dreamId > 0 ? this.dreamService.getById(this.dreamId, false) : throwError(null),
          (o, dream) => ({ ...o, dream })
        ),
        switchMap(r => !!r.dream ? of(r) : throwError(null))
      )
      .subscribe(
        ({ user, params, dream }) => {
          this.user = user;
          this.fromMark = params.from?.toString() || "";
          this.dream = dream;
          this.ready = true;
          // Заголовок
          this.setTitle();
          // Обновить
          this.changeDetectorRef.detectChanges();
        },
        () => this.router.navigate(["404"])
      );
  }

  // Установить название страницы
  private setTitle(): void {
    this.titleService.setTitle(this.globalService.createTitle([
      this.dream.title,
      this.pageTitle
    ]));
  }
}





// Данные плавающей кнопки
interface FloatButtonData {
  icon: string;
  link: string;
  params?: SimpleObject;
}
