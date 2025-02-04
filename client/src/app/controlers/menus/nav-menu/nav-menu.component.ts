import { PopupLanguageListComponent } from "@_controlers/language-list/language-list.component";
import { CreateArray, ScrollElement } from "@_datas/app";
import { DrawDatas } from "@_helpers/draw-datas";
import { ParseFloat } from "@_helpers/math";
import { WaitObservable } from "@_helpers/rxjs";
import { User } from "@_models/account";
import { CustomObject, SimpleObject } from "@_models/app";
import { BackgroundHorizontalPosition, BackgroundVerticalPosition } from "@_models/appearance";
import { MenuItem } from "@_models/menu";
import { DrawDataPeriod, DrawDataValue, DrawDatasKeys, NavMenuType } from "@_models/nav-menu";
import { ScreenKeys, ScrollData } from "@_models/screen";
import { AccountService } from "@_services/account.service";
import { MenuService } from "@_services/menu.service";
import { ScreenService } from "@_services/screen.service";
import { ScrollService } from "@_services/scroll.service";
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChange, SimpleChanges, ViewChild } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { appSetUserSelectAction, userSelectSelector } from "@app/reducers/app";
import { Store } from "@ngrx/store";
import { Subject, forkJoin, fromEvent, merge, mergeMap, takeUntil, tap, timer } from "rxjs";





@Component({
  selector: "app-main-menu",
  templateUrl: "./nav-menu.component.html",
  styleUrls: ["./nav-menu.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MenuService]
})

export class NavMenuComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() type: NavMenuType = NavMenuType.collapse;
  @Input() image = "";
  @Input() class = "";
  @Input() autoCollapse = false;
  @Input() imagePositionX: BackgroundHorizontalPosition = "center";
  @Input() imagePositionY: BackgroundVerticalPosition = "center";
  @Input() imageOverlay = true;
  @Input() imageFullShow = false;

  @Input() mainTitle = "";
  @Input() subTitle = "";
  @Input() lastSeenUser: User;
  @Input() avatarImage = "";
  @Input() avatarIcon = "";
  @Input() avatarCustomIcon = "";
  @Input() avatarBlink = false;

  @Input() floatButtonIcon = "";
  @Input() floatButtonText = "";
  @Input() floatButtonLink: string;
  @Input() floatButtonLinkParams: SimpleObject;

  @Input() backButtonLink: string;
  @Input() backButtonLinkParams: SimpleObject;

  @Input() hideToContentButton = false;

  @Output() floatButtonCallback: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild("mainMenuElement", { read: ElementRef }) private mainMenuElement: ElementRef<HTMLDivElement>;
  @ViewChild("contentLayerContainer", { read: ElementRef }) private contentLayerContainer: ElementRef;
  @ViewChild("contentLayerContainerLeft", { read: ElementRef }) private contentLayerContainerLeft: ElementRef;

  imagePrefix = "/assets/images/backgrounds/";
  tempImage = "";
  tempImagePositionY = "";
  tempImagePositionX = "";
  tempImageOverlay = true;
  private readonly clearTempImageTimeout = 300;
  isShowNotifications = false;

  private readonly mobileBreakpoints: ScreenKeys[] = ["xxsmall", "xsmall", "small"];
  mobileMenuStates: typeof MobileMenuState = MobileMenuState;

  user: User;
  isAutorizedUser = false;

  private scroll = 0;
  private breakpoint: ScreenKeys = "default";
  headerHeight = DrawDatas.minHeight;

  isMobile = false;
  showMobileMenu = false;
  menuItems: MenuItem[] = [];
  minHeight = 0;
  maxHeight = 0;

  private scrollMousePosY = 0;
  private scrollMouseStartY = 0;
  private swipeScrollDistance = 0;

  readonly notificationRepeat = CreateArray(2);
  readonly tooManyNotificationSymbol = "+";

  private readonly mobileMenuBottomBodyClass = "mobile-menu-bottom-spacing";

  css: CustomObject<SimpleObject> = {};

  private destroyed$: Subject<void> = new Subject<void>();





  // Шаг для смещения шапки
  private get mouseSwipeStep(): number {
    return Math.max(this.maxHeight / 10, 50);
  };

  // Получить ключи для CSS правил
  get cssNames(): SimpleObject {
    const hasIconButton = this.backButtonLink || this.isMobile;
    // Свойства
    CssNamesVar.subtitle = !!this.backButtonLink?.length
      ? "subtitleWithBackButton" :
      "subtitle";
    CssNamesVar.menuList = !!this.floatButtonIcon?.length
      ? "menuListWithFloatingButton"
      : "menuList";
    CssNamesVar.helper = this.type == NavMenuType.short && !!this.floatButtonIcon?.length
      ? "helperWithFloatingButton"
      : "helper";
    // Расчет заголовка
    {
      // С кнопкой и аватаркой
      if (hasIconButton && this.hasAvatar) {
        CssNamesVar.title = "titleWithBackButtonAndAvatar";
      }
      // Только с кнопкой
      else if (hasIconButton && !this.hasAvatar) {
        CssNamesVar.title = "titleWithBackButton";
      }
      // Только с аватркой
      else if (!hasIconButton && this.hasAvatar) {
        CssNamesVar.title = "titleWithAvatar";
      }
      // по умолчанию
      else {
        CssNamesVar.title = "title";
      }
    }
    // Расчет подзаголовка
    {
      // С кнопкой и аватаркой
      if (hasIconButton && this.hasAvatar) {
        CssNamesVar.subtitle = "subtitleWithBackButtonAndAvatar";
      }
      // Только с кнопкой
      else if (hasIconButton && !this.hasAvatar) {
        CssNamesVar.subtitle = "subtitleWithBackButton";
      }
      // Только с аватркой
      else if (!hasIconButton && this.hasAvatar) {
        CssNamesVar.subtitle = "subtitleWithAvatar";
      }
      // По умолчанию
      else {
        CssNamesVar.subtitle = "subtitle";
      }
    }
    // Расчет аватарки
    {
      CssNamesVar.avatar = hasIconButton
        ? "avatarWithBackButton"
        : "avatar";
    }
    // Вернуть CSS правила
    return CssNamesVar;
  }

  // Состояние шапки
  private get getHeaderStatus(): HeaderStatus {
    return this.scroll === 0 ?
      HeaderStatus.expanded :
      this.scroll >= this.getHeaderMaxHeight ?
        HeaderStatus.collapsed :
        HeaderStatus.inProccess;
  }

  // Максимальная высота шапки
  private get getHeaderMaxHeight(): number {
    return Math.round(DrawDatas.maxHeight - DrawDatas.minHeight);
  }

  // Проверить есть ли аватарка
  get hasAvatar(): boolean {
    return !!this.avatarImage || !!this.avatarIcon || !!this.avatarCustomIcon;
  }





  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private screenService: ScreenService,
    private accountService: AccountService,
    private menuService: MenuService,
    private scrollService: ScrollService,
    private matDialog: MatDialog,
    private store$: Store
  ) {
    DrawDatas.dataRender();
    // Запретить скролл к предыдущему месту
    history.scrollRestoration = "manual";
  }

  ngOnInit() {
    this.minHeight = DrawDatas.minHeight;
    this.maxHeight = DrawDatas.maxHeight;
    // Прослушивание событий
    this.scrollListener();
    this.menuListener();
    this.breakpointListener();
    this.deviceTypeListener();
    this.userListener();
    // Скролл
    this.scrollService.scrollToY(0, "auto", false);
  }

  ngOnChanges(changes: SimpleChanges) {
    const arrayChanges: SimpleChange[] = Object.values(changes) ?? [];
    // Установить новую картинку
    if (changes.image && !changes.image.firstChange && changes.image.previousValue !== changes.image.currentValue) {
      // Старые значения
      this.tempImage = changes.image.previousValue;
      this.tempImagePositionY = changes.imagePositionY?.previousValue ?? this.imagePositionY;
      this.tempImagePositionX = changes.imagePositionX?.previousValue ?? this.imagePositionX;
      this.tempImageOverlay = changes.imageOverlay?.previousValue ?? this.imageOverlay;
      // Новые значения
      this.image = changes.image.currentValue;
      this.imagePositionY = changes.imagePositionY?.currentValue ?? this.imagePositionY;
      this.imagePositionX = changes.imagePositionX?.currentValue ?? this.imagePositionX;
      this.imageOverlay = changes.imageOverlay?.currentValue ?? this.imageOverlay;
      // Очистить временную картинку
      timer(this.clearTempImageTimeout)
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() => {
          this.tempImage = "";
          this.changeDetectorRef.detectChanges();
        });
    }
    // Очистить старую картинку
    else {
      this.tempImage = "";
    }
    // Пересчитать размеры
    if (!!arrayChanges?.length && arrayChanges.some(c => !c.isFirstChange() && c.currentValue !== c.previousValue)) {
      this.onResize();
    }
  }

  ngAfterViewInit() {
    this.minHeight = DrawDatas.minHeight;
    this.maxHeight = DrawDatas.maxHeight;
    // События
    this.textSizeChangesListener();
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Скролл закончился
  private onAlwaysEndScroll(currentScroll: ScrollData): void {
    const headerStatus = this.getHeaderStatus;
    // Схлопнуть / развернуть меню
    if (!!currentScroll?.emitEvent && headerStatus === HeaderStatus.inProccess) {
      // Схлопнуть меню
      if (currentScroll?.lastDirectionY === 1) {
        this.collapseMenu();
      }
      // Развернуть меню
      else if (currentScroll?.lastDirectionY === -1) {
        this.expandMenu();
      }
    }
  }

  // Изменение размеров экрана
  private onResize(): void {
    const scrollElement: HTMLElement = ScrollElement();
    // Максимальная высота шапки
    this.maxHeight = DrawDatas.maxHeight;
    // Запомнить настройки
    DrawDatas.type = this.type;
    DrawDatas.screenWidth = scrollElement.clientWidth;
    DrawDatas.screenHeight = scrollElement.clientHeight;
    DrawDatas.containerWidth = this.contentLayerContainer?.nativeElement?.offsetWidth ?? 0;
    DrawDatas.containerLeftWidth = this.contentLayerContainerLeft?.nativeElement?.offsetWidth ?? 0;
    DrawDatas.dataRender();
    // Расчет и отрисовка
    this.dataCalculate(this.scrollService.getCurrentScroll);
  }

  // Фокус для скролла смахиванием
  onScrollMouseDown(event: MouseEvent | TouchEvent): void {
    this.scrollMousePosY = event instanceof MouseEvent
      ? event.y
      : event.touches.item(0).clientY;
    this.scrollMouseStartY = this.scrollService.getCurrentScroll.y;
    this.store$.dispatch(appSetUserSelectAction({ userSelect: false }));
  }

  // Движение мышкой
  onScrollMouseMove(event: MouseEvent | TouchEvent): void {
    this.swipeScrollDistance = (event instanceof MouseEvent ? event.y : event.touches.item(0).clientY) - this.scrollMousePosY;
    // Установить скролл
    this.scrollService.scrollToY(this.scrollMouseStartY - this.swipeScrollDistance, "auto", false);
  }

  // Потеря фокуса любым элементом
  onScrollMouseUp(event: Event | MouseEvent | TouchEvent): void {
    this.store$.dispatch(appSetUserSelectAction({ userSelect: true }));
    // Для мышки
    if (event instanceof MouseEvent) {
      this.onSwipeDetect();
    }
  }

  // Открыть или закрыть меню свайпом
  private onSwipeDetect(): void {
    const headerStatus = this.getHeaderStatus;
    // Установить скролл
    if (this.autoCollapse && Math.abs(this.swipeScrollDistance) >= this.mouseSwipeStep) {
      // Развернуть
      if (this.swipeScrollDistance > 0) {
        this.expandMenu();
      }
      // Схлопнуть
      else {
        this.collapseMenu();
      }
    }
    // Вернуть обратно
    else if (this.autoCollapse && Math.abs(this.swipeScrollDistance) > 0) {
      // Развернуть
      if (this.swipeScrollDistance < 0 && headerStatus !== HeaderStatus.collapsed) {
        this.expandMenu();
      }
      // Схлопнуть
      else if (this.swipeScrollDistance > 0 || headerStatus === HeaderStatus.collapsed) {
        this.collapseMenu();
      }
    }
    // Остановить слушателя
    this.swipeScrollDistance = 0;
  }

  // Нажатие по плавающей кнопке
  onFloatButtonClick(): void {
    this.floatButtonCallback.emit();
  }

  // Ошибка загрузки аватарки
  onAvatarError(): void {
    this.avatarImage = null;
    this.avatarIcon = this.avatarIcon ?? "hide_image";
  }

  // Наведение мышки на пункт меню без действия
  onMenuItemClick(menuItem: MenuItem): void {
    if (menuItem?.id === "notifications") {
      this.isShowNotifications ?
        this.hideNotifications() :
        this.showNotifications();
    }
    // Язык
    if (menuItem?.id === "current-language-mobile") {
      this.toggleMobileMenu(MobileMenuState.close);
      // Открыть окно
      PopupLanguageListComponent.open(this.matDialog)
        .afterClosed()
        .pipe(takeUntil(this.destroyed$))
        .subscribe();
    }
  }

  // Изменение статуса отображения списка уведомлений
  onShowNotificationsChange(state: boolean): void {
    this.isShowNotifications = state;
    this.changeDetectorRef.detectChanges();
  }






  // Расчет параметров шапки
  private dataCalculate(currentScroll: ScrollData): void {
    this.scroll = Math.max(0, currentScroll.y);
    // Проход по параметрам
    for (let titleKey in this.cssNames) {
      let titleValue = this.cssNames[titleKey];
      this.css[titleKey] = {};
      // Свойство существует
      if (DrawDatas[titleValue as DrawDatasKeys]) {
        for (let datas of DrawDatas[titleValue as DrawDatasKeys]) {
          let sizes: DrawDataPeriod = datas.data[this.breakpoint as ScreenKeys] ?
            datas.data[this.breakpoint as ScreenKeys] as DrawDataPeriod :
            datas.data.default;
          // Значение
          let value: string
          // Определить значение для заранее заданных значений
          if (!!sizes.value) {
            value = this.dataChoiceValue(sizes.value);
          }
          // Расчитать зависимое значение
          else {
            value =
              (sizes.prefixUnit ? sizes.prefixUnit : "") +
              this.dataCalculateFormula(sizes.max ?? 0, sizes.min ?? 0, sizes.unit, sizes.separatorUnit) +
              (sizes.sufixUnit ? sizes.sufixUnit : "")
              ;
          }

          // Установить для одного свойства
          if (typeof datas.property === "string") {
            this.css[titleKey][datas.property] = value;
          }
          // Для массива свойств
          else if (Array.isArray(datas.property)) {
            for (let property of datas.property) {
              this.css[titleKey][property?.toString()] = value;
            }
          }
        }
      }
    }
    // Скролл вспомогательного элемента
    this.css.helper.top = Math.max(0, this.scroll - (DrawDatas.maxHeight - DrawDatas.minHeight)) + "px";
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Формула расчета параметров
  private dataCalculateFormula(max: number | number[], min: number | number[], unit: string | string[] = "", separator = ""): string {
    const headerMaxHeight = this.getHeaderMaxHeight;
    const minMaxIsArray = Array.isArray(min) || Array.isArray(max);
    // Расчет
    if (this.scroll < headerMaxHeight) {
      // Для массивов
      if (minMaxIsArray) {
        let value = "";
        const length = Array.isArray(min) && Array.isArray(max)
          ? Math.max(min.length, max.length)
          : (Array.isArray(min) ? min.length : Array.isArray(max) ? max.length : 1);
        // Цикл по данным
        for (let i = 0; i < length; i++) {
          const tempMin = Array.isArray(min)
            ? ParseFloat(min[i])
            : min;
          const tempMax = Array.isArray(max)
            ? ParseFloat(max[i])
            : max;
          const tempUnit = Array.isArray(unit)
            ? unit[i] ?? ""
            : unit;
          const koof = (tempMin - tempMax) / headerMaxHeight;
          // Присвоение значения
          value += (i > 0 ? separator : "") + ((koof * this.scroll) + tempMax) + tempUnit;
        }
        // Вернуть значение
        return value;
      }
      // Оба числа
      else {
        const koof = (min - max) / headerMaxHeight;
        // Обозначение
        unit = Array.isArray(unit)
          ? unit[0]
          : unit;
        // Расчитать значение
        return ((koof * this.scroll) + max) + unit;
      }
    }
    // Вернуть минимальное значение
    else {
      // Для массивов
      if (minMaxIsArray) {
        let value = "";
        const length = Array.isArray(min) && Array.isArray(max) ?
          (min.length + max.length) / 2 :
          (Array.isArray(min) ? min.length : Array.isArray(max) ? max.length : 1);
        // Цикл по данным
        for (let i = 0; i < length; i++) {
          const tempMin = Array.isArray(min)
            ? ParseFloat(min[i])
            : min;
          const tempUnit = Array.isArray(unit)
            ? unit[i] ?? ""
            : unit;
          // Присвоение значения
          value += (i > 0 ? separator : "") + tempMin + tempUnit;
        }
        // Вернуть значение
        return value;
      }
      // Для чисел
      else {
        unit = Array.isArray(unit)
          ? unit[0] ?? ""
          : unit;
        // Расчитать значение
        return min + unit;
      }
    }
  }

  // Выбрать значение из списка
  private dataChoiceValue(value: DrawDataValue): string {
    if (this.scroll < this.getHeaderMaxHeight) {
      // Для промежуточного состояния
      if (this.scroll > 0 && !!value.process) {
        return value.process;
      }
      // Для развернутого меню
      else if (this.scroll === 0 && !!value.expand) {
        return value.expand;
      }
    }
    // Для схлопнутого меню
    else if (this.scroll >= this.getHeaderMaxHeight && value.collapse) {
      return value.collapse;
    }
    // По умолчанию
    return value.default;
  }

  // Переключить меню
  toggleMobileMenu(action: MobileMenuState): void {
    // Открыть меню
    if (action === MobileMenuState.open) {
      this.showMobileMenu = true;
    }
    // Закрыть меню
    if (action === MobileMenuState.close) {
      this.showMobileMenu = false;
    }
  }

  // Схлопнуть меню
  collapseMenu(): void {
    this.scrollService.scrollToY(this.getHeaderMaxHeight, "smooth", false);
  }

  // Развернуть меню
  expandMenu(): void {
    this.scrollService.scrollToY(0, "smooth", false);
  }

  // Показать уведомления
  showNotifications(): void {
    timer(1)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.isShowNotifications = true;
        this.changeDetectorRef.detectChanges();
      })
  }

  // Показать уведомления
  hideNotifications(): void {
    this.isShowNotifications = false;
    this.changeDetectorRef.detectChanges();
  }





  // События скрола
  private scrollListener() {
    merge(
      this.scrollService.onAlwaysScroll().pipe(tap(data => this.dataCalculate(data))),
      this.scrollService.onAlwaysEndScroll().pipe(tap(data => this.onAlwaysEndScroll(data))),
      this.screenService.elmResize(ScrollElement()).pipe(tap(() => this.onResize()))
    )
      .pipe(takeUntil(this.destroyed$))
      .subscribe();
  }

  // Пункты меню
  private menuListener() {
    this.menuService.menuItems$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(menuItems => {
        this.menuItems = menuItems;
        this.changeDetectorRef.detectChanges();
      });
  }

  // Подписка на брейкпоинт
  private breakpointListener() {
    this.screenService.breakpoint$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(breakpoint => {
        const scrollElement: HTMLElement = ScrollElement();
        // Добавить класс мобильного меню снизу
        if (this.mobileBreakpoints.includes(breakpoint)) {
          scrollElement.classList.add(this.mobileMenuBottomBodyClass);
        }
        // Убрать класс мобильного меню снизу
        else {
          scrollElement.classList.remove(this.mobileMenuBottomBodyClass);
        }
        // Сохранить параметры
        this.breakpoint = breakpoint;
        this.onResize();
      });
  }

  // Подписка на тип устройства
  private deviceTypeListener() {
    this.screenService.isMobile$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
        this.onResize();
      });
  }

  // Подписка на данные о текущем пользователей
  private userListener() {
    this.accountService.user$()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(user => {
        this.user = user;
        this.isAutorizedUser = this.accountService.checkAuth;
        this.changeDetectorRef.detectChanges();
      });
  }

  // Изменения размера контейнера текста
  private textSizeChangesListener() {
    forkJoin([
      WaitObservable(() => !this.contentLayerContainer?.nativeElement),
      WaitObservable(() => !this.contentLayerContainerLeft?.nativeElement)
    ])
      .pipe(
        mergeMap(() => this.screenService.elmResize(this.contentLayerContainer.nativeElement)),
        mergeMap(() => this.screenService.elmResize(this.contentLayerContainerLeft.nativeElement)),
        takeUntil(this.destroyed$)
      )
      .subscribe(() => this.onResize());
  }
}





// Действия с мобильным меню
enum MobileMenuState {
  open,
  close
}

// Состояние шапки
enum HeaderStatus {
  expanded,
  inProccess,
  collapsed
};

// Массив ключей свойств
const CssNamesVar: SimpleObject = {
  menu: "menu",
  menuLayer: "menuLayer",
  menuContainer: "menuContainer",
  menuList: "",
  menuSubList: "menuSubList",
  menuSubListDecorator: "menuSubListDecorator",
  menuItem: "menuItem",
  menuItemIcon: "menuItemIcon",
  menuItemIconAndText: "menuItemIconAndText",
  menuItemCounter: "menuItemCounter",
  menuItemCounterElm: "menuItemCounterElm",
  menuItemLine: "menuItemLine",
  menuSubItem: "menuSubItem",
  menuSubItemLast: "menuSubItemLast",
  menuSubItemLine: "menuSubItemLine",
  menuSubItemSeparator: "menuSubItemSeparator",
  notificationsList: "notificationsList",
  helper: "",
  header: "header",
  image: "image",
  scroll: "scroll",
  title: "",
  subtitle: "",
  avatar: "",
  floatingButton: "floatingButton",
  floatingButtonText: "floatingButtonText",
  floatingButtonOverlay: "floatingButtonOverlay",
  backButton: "backButton",
  toContentButton: "toContentButton"
};
