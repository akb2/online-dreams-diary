import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import "@ckeditor/ckeditor5-build-classic/build/translations/ru";
import { NavMenuComponent } from "@_controlers/nav-menu/nav-menu.component";
import { WaitObservable } from "@_datas/api";
import { DreamTitle } from "@_datas/dream-map-settings";
import { CheckInRange, ParseInt } from "@_helpers/math";
import { User } from "@_models/account";
import { SimpleObject } from "@_models/app";
import { CommentMaterialType } from "@_models/comment";
import { Dream, DreamMode } from "@_models/dream";
import { NavMenuType } from "@_models/nav-menu";
import { ScreenKeys } from "@_models/screen";
import { AccountService } from "@_services/account.service";
import { CanonicalService } from "@_services/canonical.service";
import { DreamService } from "@_services/dream.service";
import { GlobalService } from "@_services/global.service";
import { ScreenService } from "@_services/screen.service";
import { fromEvent, map, merge, mergeMap, of, Subject, switchMap, takeUntil, throwError } from "rxjs";





@Component({
  selector: "app-diary-viewer",
  templateUrl: "./diary-viewer.component.html",
  styleUrls: ["./diary-viewer.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DiaryViewerComponent implements OnInit, OnDestroy {


  @ViewChild("mainMenu", { read: NavMenuComponent }) private mainMenu: NavMenuComponent;
  @ViewChild("contentPanel", { read: ElementRef }) private contentPanel: ElementRef;
  @ViewChild("leftPanel", { read: ElementRef }) private leftPanel: ElementRef;
  @ViewChild("rightPanel", { read: ElementRef }) private rightPanel: ElementRef;

  imagePrefix: string = "../../../../assets/images/backgrounds/";
  ready: boolean = false;
  private pageTitle: string = "Просмотр сновидения";

  defaultTitle: string = DreamTitle;
  today: Date = new Date();
  private beforeScroll: number = 0;

  _navMenuType: typeof NavMenuType = NavMenuType;
  commentMaterialType: CommentMaterialType = CommentMaterialType.Dream;

  dreamId: number = 0;
  private fromMark: string;
  dream: Dream;
  user: User;

  leftPanelHelperShift: number = 0;
  rightPanelHelperShift: number = 0;

  private destroyed$: Subject<void> = new Subject<void>();





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

  // Подзаголовок стены без записей
  getWallEmptySubTitle(name: string): string {
    return this.dream?.user?.id === this.user?.id ?
      "Напишите первый комментарий к своему сновидению" : !!this.user?.id ?
        "Будьте первым, напишите что-нибудь интересное про сновидение " + name :
        "Авторизуйтесь или зарегистрируйтесь, чтобы оставлять комментарии";
  }





  constructor(
    private activatedRoute: ActivatedRoute,
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef,
    private dreamService: DreamService,
    private router: Router,
    private titleService: Title,
    private globalService: GlobalService,
    private screenService: ScreenService,
    private canonicalService: CanonicalService
  ) {
    this.dreamId = parseInt(this.activatedRoute.snapshot.params.dreamId);
    this.dreamId = isNaN(this.dreamId) ? 0 : this.dreamId;
  }

  ngOnInit() {
    this.defineData();
    // Прокрутка левой колонки
    WaitObservable(() => !this.contentPanel?.nativeElement || !this.leftPanel?.nativeElement || !this.rightPanel?.nativeElement)
      .pipe(
        takeUntil(this.destroyed$),
        map(() => ({
          contentPanel: this.contentPanel.nativeElement,
          leftPanel: this.leftPanel.nativeElement,
          rightPanel: this.rightPanel.nativeElement
        })),
        mergeMap(({ contentPanel, leftPanel, rightPanel }) => merge(
          fromEvent(document, "scroll"),
          this.screenService.elmResize([contentPanel, leftPanel, rightPanel])
        ))
      )
      .subscribe(() => this.onPanelsPosition());
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Скролл панелей
  private onPanelsPosition(): void {
    if (!!this.contentPanel?.nativeElement && !!this.leftPanel?.nativeElement && !!this.rightPanel?.nativeElement) {
      const contentPanel: HTMLElement = this.contentPanel.nativeElement;
      const leftPanel: HTMLElement = this.leftPanel.nativeElement;
      const rightPanel: HTMLElement = this.rightPanel.nativeElement;
      const spacing: number = ParseInt(getComputedStyle(contentPanel).rowGap);
      const mainMenuHeight: number = this.mainMenu.headerHeight;
      const contentPanelHeight: number = contentPanel.clientHeight;
      const leftPanelHeight: number = leftPanel.clientHeight;
      const rightPanelHeight: number = rightPanel.clientHeight;
      const headerShift: number = mainMenuHeight + spacing;
      const availLeftShift: boolean = contentPanelHeight < leftPanelHeight;
      const availRightShift: boolean = contentPanelHeight < rightPanelHeight;
      const screenHeight: number = window.innerHeight - headerShift - spacing;
      const scrollShift: number = scrollY - this.beforeScroll;
      const maxShift: number = contentPanelHeight - screenHeight - headerShift;
      // Если отступ допустим
      this.leftPanelHelperShift = availLeftShift && contentPanelHeight > screenHeight ?
        -CheckInRange(scrollShift - this.leftPanelHelperShift, maxShift, -headerShift) :
        headerShift;
      // Если отступ допустим
      this.rightPanelHelperShift = availRightShift && contentPanelHeight > screenHeight ?
        -CheckInRange(scrollShift - this.rightPanelHelperShift, maxShift, -headerShift) :
        headerShift;
      // Обновить
      this.beforeScroll = scrollY;
      this.changeDetectorRef.detectChanges();
    }
  }





  // Определить данные
  private defineData(): void {
    this.accountService.user$()
      .pipe(
        takeUntil(this.destroyed$),
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
          this.setSEO();
          // Обновить
          this.changeDetectorRef.detectChanges();
        },
        () => this.router.navigate(["404"])
      );
  }

  // Установить название страницы
  private setSEO(): void {
    this.titleService.setTitle(this.globalService.createTitle([
      this.dream.title,
      this.pageTitle
    ]));
    // Каноничный адрес
    this.canonicalService.setURL("diary/viewer/" + this.dream.id);
  }
}





// Данные плавающей кнопки
interface FloatButtonData {
  icon: string;
  link: string;
  params?: SimpleObject;
}
