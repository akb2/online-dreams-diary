import { CommentListComponent } from "@_controlers/comment-list/comment-list.component";
import { NavMenuComponent } from "@_controlers/nav-menu/nav-menu.component";
import { WaitObservable } from "@_datas/api";
import { DreamMoods, DreamStatuses, DreamTypes } from "@_datas/dream";
import { DreamTitle } from "@_datas/dream-map-settings";
import { CheckInRange, ParseInt } from "@_helpers/math";
import { TextMessage } from "@_helpers/text-message";
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
import { ScrollService } from "@_services/scroll.service";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Optional, Self, ViewChild } from "@angular/core";
import { NgControl } from "@angular/forms";
import { DomSanitizer, Title } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { EmojiService } from "@ctrl/ngx-emoji-mart/ngx-emoji";
import { Subject, concatMap, map, merge, mergeMap, of, switchMap, takeUntil, throwError } from "rxjs";





@Component({
  selector: "app-diary-viewer",
  templateUrl: "./diary-viewer.component.html",
  styleUrls: ["./diary-viewer.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DiaryViewerComponent extends TextMessage implements OnInit, OnDestroy {


  @ViewChild("mainMenu", { read: NavMenuComponent }) private mainMenu: NavMenuComponent;
  @ViewChild("contentPanel", { read: ElementRef }) private contentPanel: ElementRef;
  @ViewChild("leftPanel", { read: ElementRef }) private leftPanel: ElementRef;
  @ViewChild("rightPanel", { read: ElementRef }) private rightPanel: ElementRef;
  @ViewChild("keywordsPanel", { read: ElementRef }) private keywordsPanel: ElementRef;
  @ViewChild("keywordsPanelHelper", { read: ElementRef }) private keywordsPanelHelper: ElementRef;
  @ViewChild("keywordsPanelElm", { read: ElementRef }) private keywordsPanelElm: ElementRef;
  @ViewChild("interpretationPanel", { read: ElementRef }) private interpretationPanel: ElementRef;
  @ViewChild("commentListElm", { read: CommentListComponent }) private commentListElm: CommentListComponent;

  imagePrefix: string = "../../../../assets/images/backgrounds/";
  ready: boolean = false;
  interpretationLoading: boolean = false;
  private pageTitle: string = "Просмотр сновидения";

  defaultTitle: string = DreamTitle;
  today: Date = new Date();
  private beforeScroll: number = 0;
  selectedKeyword: string;
  selectedKeywordCount: number = 0;

  _navMenuType: typeof NavMenuType = NavMenuType;
  commentMaterialType: CommentMaterialType = CommentMaterialType.Dream;

  dreamId: number = 0;
  private fromMark: string;
  dream: Dream;
  dreamText: string;
  otherDreams: Dream[];
  user: User;
  authState: boolean;
  writeAccess: boolean = false;
  readAccess: boolean = false;
  replyUser: User;

  topPanelHelperShift: number = 0;
  leftPanelHelperShift: number = 0;
  rightPanelHelperShift: number = 0;
  topPanelOpen: boolean = false;
  isMobile: boolean = false;

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
      data.icon = "stylus";
      data.link = "/diary/editor/" + this.dream.id;
      data.params.from = this.fromMark + (this.fromMark.length > 0 ? "|" : "") + "diary-viewer";
    }
    // Вернуть данные
    return data;
  }

  // Доступен ли просмотр текста
  get isTextAvail(): boolean {
    return !!this.dream && (this.dream.mode === DreamMode.mixed || this.dream.mode === DreamMode.text) && !!this.dream?.text;
  }

  // Доступен ли просмотр текста
  get isMapAvail(): boolean {
    return !!this.dream && (this.dream.mode === DreamMode.mixed || this.dream.mode === DreamMode.map) && !!this.dream.map;
  }

  // Подзаголовок стены без записей
  getWallEmptySubTitle(name: string): string {
    return this.dream?.user?.id === this.user?.id ?
      "Напишите первый комментарий к своему сновидению" : !!this.user?.id ?
        "Будьте первым, напишите что-нибудь интересное про сновидение " + name :
        "Авторизуйтесь или зарегистрируйтесь, чтобы оставлять комментарии";
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

  // Доступно ли раскрытие списка
  get keywordsExpandLines(): number {
    const keywordsPanel: HTMLElement = this.keywordsPanel?.nativeElement;
    const keywordsPanelHelper: HTMLElement = this.keywordsPanelHelper?.nativeElement;
    const keywordsPanelElm: HTMLElement = this.keywordsPanelElm?.nativeElement;
    // Элементы доступны
    if (!!keywordsPanel && !!keywordsPanelHelper && !!keywordsPanelElm) {
      const keywordsPanelStyles: CSSStyleDeclaration = getComputedStyle(keywordsPanel);
      const keywordsPanelHelperStyles: CSSStyleDeclaration = getComputedStyle(keywordsPanelHelper);
      const keywordsPanelElmHeight: number = keywordsPanelElm.getBoundingClientRect().height;
      const keysPanelHelperGap: number = ParseInt(keywordsPanelHelperStyles.rowGap);
      const keywordsPanelHeight: number = keywordsPanel.getBoundingClientRect().height - ParseInt(keywordsPanelStyles.paddingTop) - ParseInt(keywordsPanelStyles.paddingBottom);
      const keywordsPanelHelperHeight: number = keywordsPanelHelper.getBoundingClientRect().height;
      // Проверка доступности
      return keywordsPanelHeight < keywordsPanelHelperHeight || this.topPanelOpen ?
        Math.ceil(keywordsPanelHelperHeight / (keywordsPanelElmHeight + keysPanelHelperGap)) :
        0;
    }
    // Не доступно
    return 0;
  }





  constructor(
    @Optional() @Self() controlDir: NgControl,
    emojiService: EmojiService,
    domSanitizer: DomSanitizer,
    private activatedRoute: ActivatedRoute,
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef,
    private dreamService: DreamService,
    private router: Router,
    private titleService: Title,
    private globalService: GlobalService,
    private screenService: ScreenService,
    private scrollService: ScrollService,
    private canonicalService: CanonicalService
  ) {
    super(controlDir, emojiService, domSanitizer);
    // Идентификатор сновидения
    this.dreamId = parseInt(this.activatedRoute.snapshot.params.dreamId);
    this.dreamId = isNaN(this.dreamId) ? 0 : this.dreamId;
  }

  ngOnInit() {
    this.defineData();
    // Прокрутка левой колонки
    WaitObservable(() => !this.contentPanel?.nativeElement || !this.leftPanel?.nativeElement || !this.rightPanel?.nativeElement || !this.keywordsPanel?.nativeElement)
      .pipe(
        takeUntil(this.destroyed$),
        map(() => ({
          contentPanel: this.contentPanel.nativeElement,
          keywordsPanel: this.keywordsPanel.nativeElement,
          leftPanel: this.leftPanel.nativeElement,
          rightPanel: this.rightPanel.nativeElement
        })),
        mergeMap(({ contentPanel, leftPanel, rightPanel, keywordsPanel }) => merge(
          this.scrollService.onAlwaysScroll().pipe(takeUntil(this.destroyed$)),
          this.screenService.elmResize([contentPanel, leftPanel, rightPanel, keywordsPanel]).pipe(takeUntil(this.destroyed$))
        ))
      )
      .subscribe(() => this.onPanelsPosition());
    // Изменение размеров панели
    WaitObservable(() => !this.interpretationPanel?.nativeElement)
      .pipe(
        takeUntil(this.destroyed$),
        concatMap(() => this.screenService.elmResize(this.interpretationPanel.nativeElement))
      )
      .subscribe(() => this.onPanelsPosition());
    // Мобильный интерфейс
    this.screenService.isMobile$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
        this.changeDetectorRef.detectChanges();
      });
    // Изменение размеров блока ключевых слов
    WaitObservable(() => !this.keywordsPanelHelper?.nativeElement)
      .pipe(
        takeUntil(this.destroyed$),
        concatMap(() => this.screenService.elmResize(this.keywordsPanelHelper.nativeElement))
      )
      .subscribe(() => this.changeDetectorRef.detectChanges());
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Скролл панелей
  private onPanelsPosition(): void {
    // Все элементы определены
    if (!!this.contentPanel?.nativeElement && !!this.leftPanel?.nativeElement && !!this.rightPanel?.nativeElement) {
      const { y: scrollY, elm: scrollElement }: ScrollData = this.scrollService.getCurrentScroll;
      const contentPanel: HTMLElement = this.contentPanel.nativeElement;
      const keywordsPanel: HTMLElement = this.keywordsPanel.nativeElement;
      const leftPanel: HTMLElement = this.leftPanel.nativeElement;
      const rightPanel: HTMLElement = this.rightPanel.nativeElement;
      const interpretationPanel: HTMLElement = this.interpretationPanel?.nativeElement;
      const contentPanelStyles: CSSStyleDeclaration = getComputedStyle(contentPanel);
      const keywordPanelStyles: CSSStyleDeclaration = getComputedStyle(keywordsPanel);
      const spacing: number = ParseInt(contentPanelStyles.rowGap);
      const mainMenuHeight: number = this.mainMenu.headerHeight;
      const mainMenuHeightDiff: number = this.mainMenu.maxHeight - mainMenuHeight;
      const contentPanelHeight: number = contentPanel.clientHeight;
      const headerShift: number = mainMenuHeight + spacing;
      const screenHeight: number = scrollElement.clientHeight - headerShift - spacing;
      const scrollShift: number = scrollY - this.beforeScroll;
      const keywordsPanelHeight: number = keywordsPanel.clientHeight;
      const leftPanelHeight: number = leftPanel.clientHeight;
      const rightPanelHeight: number = rightPanel.clientHeight;
      const availLeftShift: boolean = contentPanelHeight > leftPanelHeight;
      const availRightShift: boolean = contentPanelHeight > rightPanelHeight;
      const interpretationPanelHeight: number = !!interpretationPanel ?
        interpretationPanel.getBoundingClientRect().height + ParseInt(getComputedStyle(interpretationPanel).marginTop) :
        0;
      const maxTopShift: number = contentPanelHeight - headerShift - keywordsPanelHeight + ParseInt(keywordPanelStyles.paddingBottom) - interpretationPanelHeight;
      const headerKeywordsTop: number = CheckInRange(scrollY + spacing - mainMenuHeightDiff - ParseInt(keywordPanelStyles.paddingTop), maxTopShift);
      const headerKeywordsShift: number = headerKeywordsTop + keywordsPanelHeight;
      const screenKeywordsHeight: number = scrollElement.clientHeight - headerKeywordsShift - spacing;
      const maxLeftShift: number = leftPanelHeight - screenKeywordsHeight - headerKeywordsShift;
      const maxRightShift: number = rightPanelHeight - screenHeight - headerShift;
      // Если отступ допустим: левая панель
      this.leftPanelHelperShift = availLeftShift && leftPanelHeight > screenKeywordsHeight ?
        -CheckInRange(scrollShift - this.leftPanelHelperShift, maxLeftShift, -keywordsPanelHeight - spacing) :
        keywordsPanelHeight + spacing;
      // Если отступ допустим: правая панель
      this.rightPanelHelperShift = availRightShift && rightPanelHeight > screenHeight ?
        -CheckInRange(scrollShift - this.rightPanelHelperShift, maxRightShift, -headerShift) :
        headerShift;
      // Если отступ допустим: ключевые слова
      this.topPanelHelperShift = headerKeywordsTop;
      // Обновить
      this.beforeScroll = scrollY;
      this.changeDetectorRef.detectChanges();
    }
  }

  // Выбор ключевого слова
  onKeywordSelect(keyword?: string): void {
    this.selectedKeyword = !!keyword && keyword !== this.selectedKeyword ? keyword : null;
    this.changeDetectorRef.detectChanges();
  }

  // Количество найденных ключевых слов
  onKeywordSelectCount(count: number): void {
    this.selectedKeywordCount = count;
    this.changeDetectorRef.detectChanges();
  }

  // Создать интерапритация
  onUpdateInterpritation(): void {
    if (!this.interpretationLoading) {
      this.interpretationLoading = true;
      this.changeDetectorRef.detectChanges();
      // Интерпритация
      this.dreamService.createInterpretation(this.dream.id)
        .pipe(takeUntil(this.destroyed$))
        .subscribe(
          interpretation => {
            this.interpretationLoading = false;
            this.dream.interpretation = this.interpretationConvert(interpretation);
            // Обновить
            this.changeDetectorRef.detectChanges();
          },
          () => {
            this.interpretationLoading = false;
            this.changeDetectorRef.detectChanges();
          }
        );
    }
  }

  // Раскрыть/скрыть список
  onKeywordsExpandStateChange(): void {
    this.topPanelOpen = !this.topPanelOpen;
    this.changeDetectorRef.detectChanges();
  }

  // Был выбран пользователеь для ответа
  onReplyUserChange(replyUser: User): void {
    this.replyUser = replyUser;
    // Обновить
    this.changeDetectorRef.detectChanges();
  }





  // Определить данные
  private defineData(): void {
    this.accountService.user$(0, false, [], "dream-viewer")
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
        ),
        concatMap(
          ({ user, dream: { id, user: { id: userId } } }) => !user || (!!user?.id && userId !== user.id) ?
            this.dreamService.search({ user: userId, excludeIds: [id], sortField: "random", checkPrivate: false }, ["0002", "8100"]) :
            of({ result: [] }),
          (data, { result: otherDreams }) => ({ ...data, otherDreams })
        )
      )
      .subscribe(
        ({ user, params, dream, writeAccess, readAccess, otherDreams }) => {
          this.user = user;
          this.authState = !!this.user && !!this.user?.id;
          this.writeAccess = writeAccess;
          this.readAccess = readAccess;
          this.fromMark = params.from?.toString() || "";
          this.dream = dream;
          this.dreamText = this.textTransform(dream?.text, true)?.["changingThisBreaksApplicationSecurity"];
          this.otherDreams = otherDreams ?? [];
          this.ready = true;
          // Заменить переносы на теги
          if (!!this.dream?.interpretation) {
            this.dream.interpretation = this.interpretationConvert(this.dream.interpretation);
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

  // Подготовка интерпритации к отображению
  private interpretationConvert(interpretation: string): string {
    interpretation = interpretation.replace(new RegExp("^([\.,]+)", "ig"), "\n");
    interpretation = interpretation.replace(new RegExp("([\n\r]+)", "ig"), "\n");
    interpretation = interpretation.replace(new RegExp("^([\n\r]+)", "ig"), "");
    interpretation = interpretation.replace(new RegExp("([\n\r]+)$", "ig"), "");
    interpretation = interpretation.replace(new RegExp("([\s\t]+)", "ig"), " ");
    interpretation = "<p>" + interpretation.replace(new RegExp("\n", "ig"), "</p><p>") + "</p>";
    interpretation = interpretation.replace(/<p>[\s\n\r\t]*<\/p>/gmi, "");
    // Вернуть текст
    return interpretation;
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
