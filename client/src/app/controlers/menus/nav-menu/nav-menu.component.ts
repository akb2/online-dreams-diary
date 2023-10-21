import { PopupLanguageListComponent } from "@_controlers/language-list/language-list.component";
import { CreateArray, ScrollElement } from "@_datas/app";
import { DrawDatas } from "@_helpers/draw-datas";
import { User, UserSex } from "@_models/account";
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
  @Input() image: string = "";
  @Input() class: string = "";
  @Input() autoCollapse: boolean = false;
  @Input() imagePositionX: BackgroundHorizontalPosition = "center";
  @Input() imagePositionY: BackgroundVerticalPosition = "center";
  @Input() imageOverlay: boolean = true;
  @Input() imageFullShow: boolean = false;

  @Input() mainTitle: string = "";
  @Input() subTitle: string = "";
  @Input() lastSeenUser: User;
  @Input() avatarImage: string = "";
  @Input() avatarIcon: string = "";
  @Input() avatarCustomIcon: string = "";
  @Input() avatarBlink: boolean = false;

  @Input() floatButtonIcon: string = "";
  @Input() floatButtonText: string = "";
  @Input() floatButtonLink: string;
  @Input() floatButtonLinkParams: SimpleObject;

  @Input() backButtonLink: string;
  @Input() backButtonLinkParams: SimpleObject;

  @Input() hideToContentButton: boolean = false;

  @Output() floatButtonCallback: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild("contentLayerContainer", { read: ElementRef }) private contentLayerContainer: ElementRef;
  @ViewChild("contentLayerContainerLeft", { read: ElementRef }) private contentLayerContainerLeft: ElementRef;

  imagePrefix: string = "/assets/images/backgrounds/";
  tempImage: string = "";
  tempImagePositionY: string = "";
  tempImagePositionX: string = "";
  tempImageOverlay: boolean = true;
  private clearTempImageTimeout: number = 300;
  isShowNotifications: boolean = false;

  private mobileBreakpoints: ScreenKeys[] = ["xxsmall", "xsmall", "small"];
  mobileMenuStates: typeof MobileMenuState = MobileMenuState;

  user: User;
  isAutorizedUser: boolean = false;

  private scroll: number = 0;
  private breakpoint: ScreenKeys = "default";
  headerHeight: number = DrawDatas.minHeight;

  isMobile: boolean = false;
  showMobileMenu: boolean = false;
  menuItems: MenuItem[] = [];
  minHeight: number = 0;
  maxHeight: number = 0;

  private scrollMousePosY: number = 0;
  private scrollMouseStartY: number = 0;
  private swipeScrollDistance: number = 0;
  private swipeScrollPress: boolean = false;

  notificationRepeat: number[] = CreateArray(2);
  tooManyNotificationSymbol: string = "+";

  private mobileMenuBottomBodyClass: string = "mobile-menu-bottom-spacing";

  css: CustomObject<SimpleObject> = {};

  private destroyed$: Subject<void> = new Subject<void>();





  // Шаг для смещения шапки
  private get mouseSwipeStep(): number {
    return Math.max(this.maxHeight / 10, 50);
  };

  // Получить ключи для CSS правил
  get cssNames(): SimpleObject {
    CssNamesVar.subtitle = this.backButtonLink?.length ? "subtitleWithBackButton" : "subtitle";
    CssNamesVar.menuList = this.floatButtonIcon?.length > 0 ? "menuListWithFloatingButton" : "menuList";
    CssNamesVar.helper = this.type == NavMenuType.short && this.floatButtonIcon?.length > 0 ? "helperWithFloatingButton" : "helper";
    // Расчет заголовка
    {
      CssNamesVar.title = "title";
      // С кнопкой и аватаркой
      if ((this.backButtonLink || this.isMobile) && this.hasAvatar) {
        CssNamesVar.title = "titleWithBackButtonAndAvatar";
      }
      // Только с кнопкой
      else if ((this.backButtonLink || this.isMobile) && !this.hasAvatar) {
        CssNamesVar.title = "titleWithBackButton";
      }
      // Только с аватркой
      if (!(this.backButtonLink || this.isMobile) && this.hasAvatar) {
        CssNamesVar.title = "titleWithAvatar";
      }
    }
    // Расчет подзаголовка
    {
      CssNamesVar.subtitle = "subtitle";
      // С кнопкой и аватаркой
      if ((this.backButtonLink || this.isMobile) && this.hasAvatar) {
        CssNamesVar.subtitle = "subtitleWithBackButtonAndAvatar";
      }
      // Только с кнопкой
      else if ((this.backButtonLink || this.isMobile) && !this.hasAvatar) {
        CssNamesVar.subtitle = "subtitleWithBackButton";
      }
      // Только с аватркой
      if (!(this.backButtonLink || this.isMobile) && this.hasAvatar) {
        CssNamesVar.subtitle = "subtitleWithAvatar";
      }
    }
    // Расчет аватарки
    {
      CssNamesVar.avatar = "avatar";
      // С кнопкой и аватаркой
      if (this.backButtonLink || this.isMobile) {
        CssNamesVar.avatar = "avatarWithBackButton";
      }
    }
    // Вернуть CSS правила
    return CssNamesVar;
  }

  // Высота документа для скролла
  get scrollHeight(): number {
    return this.scrollService.getCurrentScroll.maxY - this.headerHeight;
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

  // Проверка пола
  get userIsMale(): boolean {
    return this.user.sex === UserSex.Male;
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
    private matDialog: MatDialog
  ) {
    DrawDatas.dataRender();
    // Запретить скролл к предыдущему месту
    history.scrollRestoration = "manual";
  }

  ngOnInit() {
    this.minHeight = DrawDatas.minHeight;
    this.maxHeight = DrawDatas.maxHeight;
    // События
    merge(
      this.scrollService.onAlwaysScroll().pipe(tap(data => this.dataCalculate(data))),
      this.scrollService.onAlwaysEndScroll().pipe(tap(data => this.onAlwaysEndScroll(data))),
      fromEvent<TouchEvent>(window, "touchstart").pipe(tap(event => this.onScrollMouseDown(event))),
      fromEvent<TouchEvent>(window, "touchend").pipe(tap(event => this.onMouseUp(event))),
      fromEvent<MouseEvent>(window, "mousemove").pipe(tap(event => this.onMouseMove(event))),
      fromEvent<MouseEvent>(window, "mouseup").pipe(tap(event => this.onMouseUp(event))),
      this.screenService.elmResize(ScrollElement()).pipe(tap(() => this.onResize()))
    )
      .pipe(takeUntil(this.destroyed$))
      .subscribe();
    // Пункты меню
    this.menuService.menuItems$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(menuItems => {
        this.menuItems = menuItems;
        this.changeDetectorRef.detectChanges();
      });
    // Подписка на брейкпоинт
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
    // Подписка на тип устройства
    this.screenService.isMobile$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
        this.onResize();
      });
    // Подписка на данные о текущем пользователей
    this.accountService.user$()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(user => {
        this.user = user;
        this.isAutorizedUser = this.accountService.checkAuth;
        this.changeDetectorRef.detectChanges();
      });
    // Скролл
    this.scrollService.scrollToY(0, "auto", false);
  }

  ngOnChanges(changes: SimpleChanges) {
    const arrayChanges: SimpleChange[] = Object.values(changes) ?? [];
    // Установить новую картинку
    if (changes.image && !changes.image.firstChange && changes.image.previousValue !== changes.image.currentValue) {
      // Старые значения
      this.tempImage = changes.image.previousValue;
      this.tempImagePositionY = changes.imagePositionY?.previousValue || this.imagePositionY;
      this.tempImagePositionX = changes.imagePositionX?.previousValue || this.imagePositionX;
      this.tempImageOverlay = changes.imageOverlay?.previousValue || this.imageOverlay;
      // Новые значения
      this.image = changes.image.currentValue;
      this.imagePositionY = changes.imagePositionY?.currentValue || this.imagePositionY;
      this.imagePositionX = changes.imagePositionX?.currentValue || this.imagePositionX;
      this.imageOverlay = changes.imageOverlay?.currentValue || this.imageOverlay;
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
    // Изменения размера контейнера текста
    forkJoin([this.screenService.waitWhileFalse(this.contentLayerContainer), this.screenService.waitWhileFalse(this.contentLayerContainerLeft)])
      .pipe(
        takeUntil(this.destroyed$),
        mergeMap(() => this.screenService.elmResize(this.contentLayerContainer.nativeElement)),
        mergeMap(() => this.screenService.elmResize(this.contentLayerContainerLeft.nativeElement))
      )
      .subscribe(() => this.onResize());
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
    this.scrollMousePosY = (event instanceof MouseEvent ? event.y : event.touches.item(0).clientY);
    this.scrollMouseStartY = this.scrollService.getCurrentScroll.y;
    // Включить обнаружение движения мышкой
    this.swipeScrollPress = true;
  }

  // Движение мышкой
  onMouseMove(event: MouseEvent | TouchEvent): void {
    if (this.swipeScrollPress) {
      this.swipeScrollDistance = (event instanceof MouseEvent ? event.y : event.touches.item(0).clientY) - this.scrollMousePosY;
      // Установить скролл
      this.scrollService.scrollToY(this.scrollMouseStartY - this.swipeScrollDistance, "auto", false);
    }
  }

  // Потеря фокуса любым элементом
  onMouseUp(event: MouseEvent | TouchEvent): void {
    this.swipeScrollPress = false;
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
    this.swipeScrollPress = false;
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
    this.scroll = currentScroll.y;
    // Проход по параметрам
    for (let titleKey in this.cssNames) {
      let titleValue: string = this.cssNames[titleKey];
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
              this.dataCalculateFormula(sizes.max || 0, sizes.min || 0, sizes.unit, sizes.separatorUnit) +
              (sizes.sufixUnit ? sizes.sufixUnit : "")
              ;
          }

          // Установить для одного свойства
          if (typeof datas.property === "string") {
            this.css[titleKey][datas.property] = value;
          }
          // Для массива свойств
          else {
            for (let property of datas.property) {
              this.css[titleKey][property] = value;
            }
          }
        }
      }
    }
    // Главное меню: позиция сверху
    if (!!this.cssNames.menu) {
      if (this.scroll < this.getHeaderMaxHeight) {
        this.css.menu.position = "absolute";
        this.css.menu["margin-top"] = this.scroll + "px";
      }
      // Схлопнутая шапка
      else {
        this.css.menu.position = "fixed";
        this.css.menu["margin-top"] = "0px";
      }
    }
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Формула расчета параметров
  private dataCalculateFormula(max: number | number[], min: number | number[], unit: string | string[] = "", separator: string = ""): string {
    const headerMaxHeight: number = this.getHeaderMaxHeight;
    // Расчет
    if (this.scroll < headerMaxHeight) {
      // Для массивов
      if (Array.isArray(min) || Array.isArray(max)) {
        let value: string = "";
        const length: number = Array.isArray(min) && Array.isArray(max) ?
          (min.length + max.length) / 2 :
          (Array.isArray(min) ? min.length : Array.isArray(max) ? max.length : 1);
        // Цикл по данным
        for (let i = 0; i < length; i++) {
          const tempMin: number = Array.isArray(min) ? min[i] || 0 : min;
          const tempMax: number = Array.isArray(max) ? max[i] || 0 : max;
          const tempUnit: string = Array.isArray(unit) ? unit[i] || "" : unit;
          const koof: number = (tempMin - tempMax) / headerMaxHeight;
          // Присвоение значения
          value += (i > 0 ? separator : "") + ((koof * this.scroll) + tempMax) + tempUnit;
        }
        // Вернуть значение
        return value;
      }
      // Оба числа
      else {
        unit = Array.isArray(unit) ? unit[0] : unit;
        // Расчитать значение
        const koof: number = (min - max) / headerMaxHeight;
        return ((koof * this.scroll) + max) + unit;
      }
    }
    // Вернуть минимальное значение
    else {
      // Для массивов
      if (Array.isArray(min) || Array.isArray(max)) {
        let value: string = "";
        const length: number = Array.isArray(min) && Array.isArray(max) ?
          (min.length + max.length) / 2 :
          (Array.isArray(min) ? min.length : Array.isArray(max) ? max.length : 1);
        // Цикл по данным
        for (let i = 0; i < length; i++) {
          const tempMin: number = Array.isArray(min) ? min[i] || 0 : min;
          const tempUnit: string = Array.isArray(unit) ? unit[i] || "" : unit;
          // Присвоение значения
          value += (i > 0 ? separator : "") + tempMin + tempUnit;
        }
        // Вернуть значение
        return value;
      }
      // Для чисел
      else {
        unit = Array.isArray(unit) ? unit[0] || "" : unit;
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
