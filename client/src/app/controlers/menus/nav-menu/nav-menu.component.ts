import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChange, SimpleChanges, ViewChild } from "@angular/core";
import { DrawDatas } from "@_helpers/draw-datas";
import { CustomObject, SimpleObject } from "@_models/app";
import { BackgroundHorizontalPosition, BackgroundVerticalPosition } from "@_models/appearance";
import { MenuItem } from "@_models/menu";
import { DrawDataPeriod, DrawDatasKeys, DrawDataValue, NavMenuType } from "@_models/nav-menu";
import { ScreenKeys } from "@_models/screen";
import { MenuService } from "@_services/menu.service";
import { ScreenService } from "@_services/screen.service";
import { forkJoin, fromEvent, interval, map, mergeMap, skipWhile, Subject, takeUntil, takeWhile, timer } from "rxjs";





@Component({
  selector: "app-main-menu",
  templateUrl: "./nav-menu.component.html",
  styleUrls: ["./nav-menu.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
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

  @Input() title: string = "";
  @Input() subTitle: string = "";
  @Input() avatarImage: string = "";
  @Input() avatarIcon: string = "";

  @Input() floatButtonIcon: string = "";
  @Input() floatButtonText: string = "";
  @Input() floatButtonLink: string;
  @Input() floatButtonLinkParams: SimpleObject;

  @Input() backButtonLink: string;
  @Input() backButtonLinkParams: SimpleObject;

  @Input() hideToContentButton: boolean = false;

  @Output() floatButtonCallback: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild("contentLayerContainer") private contentLayerContainer: ElementRef;
  @ViewChild("contentLayerContainerLeft") private contentLayerContainerLeft: ElementRef;

  tempImage: string = "";
  tempImagePositionY: string = "";
  tempImagePositionX: string = "";
  tempImageOverlay: boolean = true;
  private clearTempImageTimeout: number = 300;

  private autoCollapsed: boolean = false;
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
  private scrollSmoothSpeed: number = 210;
  private scrollSmoothTimeStep: number = 30;

  css: CustomObject<SimpleObject> = {};

  private destroy$: Subject<void> = new Subject<void>();





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
      if ((this.backButtonLink || this.isMobile) && (this.avatarImage || this.avatarIcon)) {
        CssNamesVar.title = "titleWithBackButtonAndAvatar";
      }
      // Только с кнопкой
      else if ((this.backButtonLink || this.isMobile) && !(this.avatarImage || this.avatarIcon)) {
        CssNamesVar.title = "titleWithBackButton";
      }
      // Только с аватркой
      if (!(this.backButtonLink || this.isMobile) && (this.avatarImage || this.avatarIcon)) {
        CssNamesVar.title = "titleWithAvatar";
      }
    }
    // Расчет подзаголовка
    {
      CssNamesVar.subtitle = "subtitle";
      // С кнопкой и аватаркой
      if ((this.backButtonLink || this.isMobile) && (this.avatarImage || this.avatarIcon)) {
        CssNamesVar.subtitle = "subtitleWithBackButtonAndAvatar";
      }
      // Только с кнопкой
      else if ((this.backButtonLink || this.isMobile) && !(this.avatarImage || this.avatarIcon)) {
        CssNamesVar.subtitle = "subtitleWithBackButton";
      }
      // Только с аватркой
      if (!(this.backButtonLink || this.isMobile) && (this.avatarImage || this.avatarIcon)) {
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
    return this.getCurrentScroll.maxY - this.headerHeight;
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

  // Текущий скролл по оси Y
  private get getCurrentScroll(): ScrollData {
    const x: number = Math.ceil(document?.scrollingElement?.scrollLeft ?? window.scrollX ?? 0);
    const y: number = Math.ceil(document?.scrollingElement?.scrollTop ?? window.scrollY ?? 0);
    const maxElms: HTMLElement[] = [document.body, document.documentElement];
    const maxKeysX: (keyof HTMLElement)[] = ["scrollWidth", "offsetWidth", "clientWidth"];
    const maxKeysY: (keyof HTMLElement)[] = ["scrollHeight", "offsetHeight", "clientHeight"];
    const maxX = Math.max(...maxElms.map(e => maxKeysX.map(k => typeof e[k] === "number" ? e[k] as number : 0)).reduce((o, v) => ([...o, ...v]), []));
    const maxY = Math.max(...maxElms.map(e => maxKeysY.map(k => typeof e[k] === "number" ? e[k] as number : 0)).reduce((o, v) => ([...o, ...v]), []));
    // Скролл
    return { x, y, maxX, maxY };
  }





  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private screenService: ScreenService,
    private menuService: MenuService
  ) {
    DrawDatas.dataRender();
    // Запретить скролл к предыдущему месту
    history.scrollRestoration = "manual";
  }

  ngOnInit() {
    this.minHeight = DrawDatas.minHeight;
    this.maxHeight = DrawDatas.maxHeight;
    // События
    fromEvent(window, "scroll").pipe(takeUntil(this.destroy$)).subscribe(e => this.onWindowScroll(e as Event));
    fromEvent(window, "mousemove").pipe(takeUntil(this.destroy$)).subscribe(e => this.onMouseMove(e as MouseEvent));
    fromEvent(window, "mouseup").pipe(takeUntil(this.destroy$)).subscribe(e => this.onMouseUp(e as MouseEvent));
    fromEvent(window, "resize").pipe(takeUntil(this.destroy$)).subscribe(() => this.onResize());
    // Пункты меню
    this.menuService.menuItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(menuItems => {
        this.menuItems = menuItems;
        this.changeDetectorRef.detectChanges();
      });
    // Подписка на брейкпоинт
    this.screenService.breakpoint$
      .pipe(takeUntil(this.destroy$))
      .subscribe(breakpoint => {
        this.breakpoint = breakpoint;
        this.onResize();
      });
    // Подписка на тип устройства
    this.screenService.isMobile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
        this.onResize();
      });
    // Скролл
    this.scroll = this.getCurrentScroll.y;
    this.scrollTo(0);
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
        .pipe(takeUntil(this.destroy$))
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
        takeUntil(this.destroy$),
        mergeMap(() => this.screenService.elmResize(this.contentLayerContainer.nativeElement)),
        mergeMap(() => this.screenService.elmResize(this.contentLayerContainerLeft.nativeElement))
      )
      .subscribe(() => this.onResize());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Событие скролла
  private onWindowScroll(event: Event): void {
    let scroll: number = this.getCurrentScroll.y;
    // Скролл
    if (!this.swipeScrollPress) {
      // Автоколапс (если уже не происходит)
      if (this.autoCollapse) {
        if (!this.autoCollapsed) {
          const headerMaxHeight: number = this.getHeaderMaxHeight;
          const headerStatus = this.getHeaderStatus;
          // Схлопнуть меню
          if (headerStatus !== HeaderStatus.collapsed && scroll > this.scroll && this.scroll < headerMaxHeight) {
            this.collapseMenu();
          }
          // Развернуть меню
          else if (headerStatus !== HeaderStatus.expanded && scroll < this.scroll && scroll < headerMaxHeight) {
            this.expandMenu();
          }
        }
        // Отменить скролл
        else {
          this.stopScroll();
        }
      }
      // Обычный скролл
      else if (!this.autoCollapse) {
      }
    }
    // Расчитать данные
    this.scroll = scroll;
    this.dataCalculate();
  }

  // Скролл закончился
  private onWindowScrollEnd(): void {
    this.autoCollapsed = false;
    // Разрешить скролл
    this.startScroll();
  }

  // Изменение размеров экрана
  private onResize(): void {
    const collapse: boolean = DrawDatas.screenHeight < window.innerHeight;
    // Запомнить настройки
    DrawDatas.type = this.type;
    DrawDatas.screenWidth = window.innerWidth;
    DrawDatas.screenHeight = window.innerHeight;
    DrawDatas.containerWidth = this.contentLayerContainer?.nativeElement?.offsetWidth ?? 0;
    DrawDatas.containerLeftWidth = this.contentLayerContainerLeft?.nativeElement?.offsetWidth ?? 0;
    DrawDatas.dataRender();
    // Схлопнуть меню
    if (collapse && this.getHeaderStatus === HeaderStatus.inProccess && this.autoCollapse) {
      this.collapseMenu();
    }
    // Расчет и отрисовка
    this.dataCalculate();
  }

  // Фокус для скролла смахиванием
  onScrollMouseDown(event: MouseEvent): void {
    this.scrollMousePosY = event.y;
    this.scrollMouseStartY = window.scrollY;
    // Включить обнаружение движения мышкой
    this.swipeScrollPress = true;
    // Запретить скролл
    this.stopScroll();
  }

  // Движение мышкой
  onMouseMove(event: MouseEvent): void {
    if (this.swipeScrollPress) {
      this.swipeScrollDistance = event.y - this.scrollMousePosY;
      // Запретить скролл
      this.stopScroll();
      // Установить скролл
      this.scrollTo(this.scrollMouseStartY - this.swipeScrollDistance);
    }
  }

  // Потеря фокуса любым элементом
  onMouseUp(event: MouseEvent): void {
    this.swipeScrollPress = false;
    this.onSwipeDetect();
  }

  // Открыть или закрыть меню свайпом
  private onSwipeDetect(): void {
    // Установить скролл
    if (this.autoCollapse && Math.abs(this.swipeScrollDistance) >= this.mouseSwipeStep) {
      // Схлопнуть
      if (this.swipeScrollDistance > 0) {
        this.expandMenu();
      }
      // Развернуть
      else {
        this.collapseMenu();
      }
    }
    // Вернуть обратно
    else if (this.autoCollapse && Math.abs(this.swipeScrollDistance) > 0) {
      // Развернуть
      if (this.swipeScrollDistance > 0) {
        this.collapseMenu();
      }
      // Схлопнуть
      else {
        this.expandMenu();
      }
    }
    // Разблокировать скролл
    else {
      this.startScroll();
    }
    // Остановить слушателя
    this.swipeScrollDistance = 0;
    this.swipeScrollPress = false;
  }

  // Нажатие по плавающей кнопке
  onFloatButtonClick(): void {
    this.floatButtonCallback.emit();
  }






  // Расчет параметров шапки
  private dataCalculate(): void {
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
  toggleMobileMenu(action: -1 | 1): void {
    // Открыть меню
    if (action === 1) {
      this.showMobileMenu = true;
      // Запретить скролл
      this.stopScroll();
    }
    // Закрыть меню
    if (action === -1) {
      this.showMobileMenu = false;
      // Разрешить скролл
      this.startScroll();
    }
  }

  // Схлопнуть меню
  collapseMenu(): void {
    this.autoCollapsed = true;
    // Скролл
    this.scrollTo(this.getHeaderMaxHeight, "smooth");
  }

  // Развернуть меню
  expandMenu(): void {
    this.autoCollapsed = true;
    // Скролл
    this.scrollTo(0, "smooth");
  }

  // Скролл
  private scrollTo(top: number, behavior: ScrollBehavior = "auto"): void {
    if (this.getCurrentScroll.y !== top) {
      if (behavior === "auto") {
        window.scrollTo({ behavior, top });
        // Окончить скролл
        this.onWindowScrollEnd();
      }
      // Плавный скролл
      else {
        const startScroll: number = this.getCurrentScroll.y;
        const scrollDiff: number = Math.abs(top - startScroll);
        const scrollDelta: -1 | 1 = ((top - startScroll) / scrollDiff) > 0 ? 1 : -1;
        const scrollSmoothStep: number = Math.ceil((scrollDiff * this.scrollSmoothTimeStep) / this.scrollSmoothSpeed);
        const scrollLastStep: number = Math.ceil(scrollDiff / scrollSmoothStep);
        // Запретить скролл
        this.stopScroll();
        // Плавный скролл
        interval(this.scrollSmoothTimeStep)
          .pipe(
            takeUntil(this.destroy$),
            map(step => step + 1),
            takeWhile(step => step < scrollLastStep, true),
          )
          .subscribe(step => {
            let scrollTo: number = step * scrollSmoothStep;
            scrollTo = scrollTo > scrollDiff ? scrollDiff : scrollTo;
            top = startScroll + (scrollTo * scrollDelta);
            // Запретить скролл
            this.stopScroll();
            // Запомнить новый скролл
            this.scroll = top;
            // Скролл
            window.scroll(0, top);
            // Закончить скролл
            if (step === scrollLastStep) {
              this.onWindowScrollEnd();
            }
          });
      }
    }
    // Окончание скролла
    else {
      this.onWindowScrollEnd();
    }
  }

  // Запретить скролл
  private stopScroll(): void {
    document.querySelectorAll("body, html").forEach(elm => elm.classList.add("no-scroll"));
  }

  // Разрешить скролл
  private startScroll(): void {
    document.querySelectorAll("body, html").forEach(elm => elm.classList.remove("no-scroll"));
  }
}





// Интерфейс данных скролла
interface ScrollData {
  x: number;
  y: number;
  maxX: number;
  maxY: number;
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
  menuItemLine: "menuItemLine",
  menuSubItem: "menuSubItem",
  menuSubItemLast: "menuSubItemLast",
  menuSubItemLine: "menuSubItemLine",
  menuSubItemSeparator: "menuSubItemSeparator",
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
