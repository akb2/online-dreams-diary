import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import "@ckeditor/ckeditor5-build-classic/build/translations/ru";
import { CommentListComponent } from "@_controlers/comment-list/comment-list.component";
import { NavMenuComponent } from "@_controlers/nav-menu/nav-menu.component";
import { WaitObservable } from "@_datas/api";
import { ScrollElement } from "@_datas/app";
import { DreamMoods, DreamStatuses, DreamTypes } from "@_datas/dream";
import { DreamTitle } from "@_datas/dream-map-settings";
import { CheckInRange, ParseInt } from "@_helpers/math";
import { User } from "@_models/account";
import { IconBackground, IconColor, SimpleObject } from "@_models/app";
import { CommentMaterialType } from "@_models/comment";
import { Dream, DreamMode } from "@_models/dream";
import { AutocompleteImageSize, OptionData } from "@_models/form";
import { NavMenuType } from "@_models/nav-menu";
import { ScrollData } from "@_models/screen";
import { AccountService } from "@_services/account.service";
import { CanonicalService } from "@_services/canonical.service";
import { DreamService } from "@_services/dream.service";
import { GlobalService } from "@_services/global.service";
import { ScreenService } from "@_services/screen.service";
import { concatMap, fromEvent, map, merge, mergeMap, of, Subject, switchMap, takeUntil, throwError } from "rxjs";





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
  @ViewChild("keywordsPanel", { read: ElementRef }) private keywordsPanel: ElementRef;
  @ViewChild("commentListElm", { read: CommentListComponent }) private commentListElm: CommentListComponent;

  imagePrefix: string = "../../../../assets/images/backgrounds/";
  ready: boolean = false;
  private pageTitle: string = "Просмотр сновидения";

  defaultTitle: string = DreamTitle;
  today: Date = new Date();
  private beforeScroll: number = 0;
  selectedKeyword: string;

  _navMenuType: typeof NavMenuType = NavMenuType;
  commentMaterialType: CommentMaterialType = CommentMaterialType.Dream;

  dreamId: number = 0;
  private fromMark: string;
  dream: Dream;
  user: User;
  authState: boolean;
  writeAccess: boolean = false;
  readAccess: boolean = false;

  leftPanelHelperShift: number = 0;
  rightPanelHelperShift: number = 0;

  private scrollEnded: boolean = false;
  private scrollEndDistance: number = 150;

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

  // Текущий скролл
  private get getCurrentScroll(): ScrollData {
    const elm: HTMLElement = ScrollElement();
    const x: number = ParseInt(Math.ceil(elm?.scrollLeft) ?? 0);
    const y: number = ParseInt(Math.ceil(elm?.scrollTop) ?? 0);
    const maxX: number = ParseInt((elm?.scrollWidth - elm?.clientWidth) ?? 0);
    const maxY: number = ParseInt((elm?.scrollHeight - elm?.clientHeight) ?? 0);
    // Скролл
    return { x, y, maxX, maxY };
  }

  // Данные о приватности сновидения
  get getDreamPrivateLabels(): DreamSettingLabels {
    if (!!this.dream) {
      const data: OptionData = DreamStatuses.find(({ key }) => key === this.dream.status.toString());
      // Вернуть данные
      return {
        image: data?.image ?? "",
        icon: data?.icon ?? "",
        color: data?.iconColor ?? "disabled",
        background: "fill",
        position: data?.imagePosition ?? "contain",
        mainTitle: "Тип доступности",
        subTitle: data?.title ?? "",
        colorized: false
      };
    }
    // Не удалось определить данные
    return null;
  }

  // Тип сновидения
  get getDreamTypeLabels(): DreamSettingLabels {
    if (!!this.dream) {
      const data: OptionData = DreamTypes.find(({ key }) => key === this.dream.type.toString());
      // Вернуть данные
      return {
        image: data?.image ?? "",
        icon: data?.icon ?? "",
        color: data?.iconColor ?? "disabled",
        background: "fill",
        position: data?.imagePosition ?? "contain",
        mainTitle: "Тип сновидения",
        subTitle: data?.title ?? "",
        colorized: true
      };
    }
    // Не удалось определить данные
    return null;
  }

  // Настроение сновидения
  get getDreamMoodLabels(): DreamSettingLabels {
    if (!!this.dream) {
      const data: OptionData = DreamMoods.find(({ key }) => key === this.dream.mood.toString());
      // Вернуть данные
      return {
        image: data?.image ?? "",
        icon: data?.icon ?? "",
        color: data?.iconColor ?? "disabled",
        background: "fill",
        position: data?.imagePosition ?? "contain",
        mainTitle: "Настроение в сновидении",
        subTitle: data?.title ?? "",
        colorized: true
      };
    }
    // Не удалось определить данные
    return null;
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
          fromEvent(ScrollElement(), "scroll").pipe(takeUntil(this.destroyed$)),
          this.screenService.elmResize([contentPanel, leftPanel, rightPanel]).pipe(takeUntil(this.destroyed$))
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
    this.onScroll();
    // Все элементы определены
    if (!!this.contentPanel?.nativeElement && !!this.leftPanel?.nativeElement && !!this.rightPanel?.nativeElement) {
      const contentPanel: HTMLElement = this.contentPanel.nativeElement;
      const keywordsPanel: HTMLElement = this.keywordsPanel.nativeElement;
      const spacing: number = ParseInt(getComputedStyle(contentPanel).rowGap);
      const mainMenuHeight: number = this.mainMenu.headerHeight;
      const contentPanelHeight: number = contentPanel.clientHeight;
      const keywordsPanelHeight: number = keywordsPanel.clientHeight;
      const keywordsPanelSpacingBottom: number = spacing - ParseInt(getComputedStyle(keywordsPanel).paddingBottom);
      const headerShift: number = mainMenuHeight + spacing;
      const headerKeywordsShift: number = mainMenuHeight + keywordsPanelHeight + keywordsPanelSpacingBottom;
      const screenHeight: number = ScrollElement().clientHeight - headerShift - spacing;
      const screenKeywordsHeight: number = ScrollElement().clientHeight - headerKeywordsShift - spacing;
      const scrollY: number = this.getCurrentScroll.y;
      const scrollShift: number = scrollY - this.beforeScroll;
      // Левая панель
      const leftPanel: HTMLElement = this.leftPanel.nativeElement;
      const leftPanelHeight: number = leftPanel.clientHeight;
      const availLeftShift: boolean = contentPanelHeight > leftPanelHeight;
      const maxLeftShift: number = leftPanelHeight - screenKeywordsHeight - headerKeywordsShift;
      // Правая панель
      const rightPanel: HTMLElement = this.rightPanel.nativeElement;
      const rightPanelHeight: number = rightPanel.clientHeight;
      const availRightShift: boolean = contentPanelHeight > rightPanelHeight;
      const maxRightShift: number = rightPanelHeight - screenHeight - headerShift;
      // Если отступ допустим: левая панель
      this.leftPanelHelperShift = availLeftShift && leftPanelHeight > screenKeywordsHeight ?
        -CheckInRange(scrollShift - this.leftPanelHelperShift, maxLeftShift, -headerKeywordsShift) :
        headerKeywordsShift;
      // Если отступ допустим: правая панель
      this.rightPanelHelperShift = availRightShift && rightPanelHeight > screenHeight ?
        -CheckInRange(scrollShift - this.rightPanelHelperShift, maxRightShift, -headerShift) :
        headerShift;
      // Обновить
      this.beforeScroll = scrollY;
      this.changeDetectorRef.detectChanges();
    }
  }

  // Прослушивание скролла
  private onScroll(): void {
    if (!!this.contentPanel?.nativeElement && !!this.rightPanel?.nativeElement && !!this.commentListElm) {
      const contentPanel: HTMLElement = this.contentPanel.nativeElement;
      const rightPanel: HTMLElement = this.rightPanel.nativeElement;
      const mainMenuHeight: number = this.mainMenu.headerHeight;
      const rightPanelHeight: number = rightPanel.clientHeight;
      const spacing: number = ParseInt(getComputedStyle(contentPanel).rowGap);
      const headerShift: number = mainMenuHeight + spacing;
      const screenHeight: number = ScrollElement().clientHeight - headerShift - spacing;
      const maxRightShift: number = rightPanelHeight - screenHeight - headerShift;
      const currentRightShift: number = -this.rightPanelHelperShift;
      // Скролл прокручен до конца
      if (maxRightShift > 0 && currentRightShift > maxRightShift - this.scrollEndDistance && !this.scrollEnded) {
        this.scrollEnded = true;
        // Загрузить новые комментарии
        this.commentListElm.loadMoreComments();
      }
      // Отменить событие окончания скролла
      else if (this.scrollEnded && currentRightShift < maxRightShift - this.scrollEndDistance) {
        this.scrollEnded = false;
      }
    }
  }

  // Выбор ключевого слова
  onKeywordSelect(keyword?: string): void {
    this.selectedKeyword = !!keyword && keyword !== this.selectedKeyword ? keyword : null;
    this.changeDetectorRef.detectChanges();
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
        switchMap(r => !!r.dream ? of(r) : throwError(null)),
        concatMap(
          ({ dream }) => !!dream?.user?.id ? this.accountService.checkPrivate("myCommentsWrite", dream.user.id, ["8100"]) : of(false),
          (data, writeAccess) => ({ ...data, writeAccess })
        ),
        concatMap(
          ({ dream }) => !!dream?.user?.id ? this.accountService.checkPrivate("myCommentsRead", dream.user.id, ["8100"]) : of(false),
          (data, readAccess) => ({ ...data, readAccess })
        )
      )
      .subscribe(
        ({ user, params, dream, writeAccess, readAccess }) => {
          this.user = user;
          this.authState = !!this.user && !!this.user?.id;
          this.writeAccess = writeAccess;
          this.readAccess = readAccess;
          this.fromMark = params.from?.toString() || "";
          this.dream = dream;
          this.ready = true;
          // Заменить переносы на теги
          if (!!this.dream?.interpretation) {
            this.dream.interpretation = this.dream.interpretation.replace(new RegExp("^([\.,]+)", "ig"), "\n");
            this.dream.interpretation = this.dream.interpretation.replace(new RegExp("([\n\r]+)", "ig"), "\n");
            this.dream.interpretation = this.dream.interpretation.replace(new RegExp("^([\n\r]+)", "ig"), "");
            this.dream.interpretation = this.dream.interpretation.replace(new RegExp("([\n\r]+)$", "ig"), "");
            this.dream.interpretation = "<p>" + this.dream.interpretation.replace("\n", "</p><p>") + "</p>";
            this.dream.interpretation = this.dream.interpretation.replace("<p></p>", "");
          }
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

// Данные о настройках
interface DreamSettingLabels {
  image: string;
  icon: string;
  color: IconColor;
  background: IconBackground;
  position: AutocompleteImageSize;
  mainTitle: string;
  subTitle: string;
  colorized: boolean;
}
