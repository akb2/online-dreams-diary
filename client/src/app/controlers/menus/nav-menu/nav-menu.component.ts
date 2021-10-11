import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from "@angular/core";
import { DrawDatas } from "@_helpers/draw-datas";
import { SimpleObject } from "@_models/app";
import { MenuItem } from "@_models/menu";
import { DrawDataPeriod, DrawDatasKeys, DrawDataValue } from "@_models/nav-menu";
import { ScreenKeys } from "@_models/screen";
import { MenuService } from "@_services/menu.service";
import { ScreenService } from "@_services/screen.service";
import smoothscroll from "smoothscroll-polyfill";





// Декоратор
@Component({
  selector: "app-main-menu",
  templateUrl: "./nav-menu.component.html",
  styleUrls: ["./nav-menu.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

// Основной класс
export class NavMenuComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {


  @Input() type: "full" | "short" | "collapse" = "collapse";
  @Input() image: string = "";
  @Input() class: string = "";
  @Input() autoCollapse: boolean = false;
  @Input() imagePositionX: string = "center";
  @Input() imagePositionY: string = "center";
  @Input() imageOverlay: boolean = true;
  @Input() imageFullShow: boolean = false;

  @Input() title: string = "";
  @Input() subTitle: string = "";
  @Input() avatarImage: string = "";
  @Input() avatarIcon: string = "";

  @Input() floatButtonIcon: string = "";
  @Input() floatButtonText: string = "";
  @Output() floatButtonCallback: EventEmitter<void> = new EventEmitter<void>();
  @Input() floatButtonLink: string;
  @Input() floatButtonLinkParams: SimpleObject;

  @Input() backButtonLink: string;
  @Input() backButtonLinkParams: SimpleObject;

  @Input() hideToContentButton: boolean = false;

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
  breakpointMobile: ScreenKeys = "small";
  headerHeight: number = DrawDatas.minHeight;

  showMobileMenu: boolean = false;
  menuItems: MenuItem[] = [];
  minHeight: number = 0;
  maxHeight: number = 0;

  private scrollMousePosY: number = 0;
  private scrollMouseStartY: number = 0;
  private swipeScrollDistance: number = 0;
  private swipeScrollPress: boolean = false;
  private lastScrollTime: number = new Date().getTime();
  private scrollTimeWait: number = 150;

  css: SimpleObject = {};

  private cssNamesVar: SimpleObject = {
    menu: "menu",
    menuList: "",
    menuItem: "menuItem",
    menuItemLine: "menuItemLine",
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

  // Шаг для смещения шапки
  private get mouseSwipeStep(): number {
    return Math.max(this.maxHeight / 10, 50);
  };

  // Получить ключи для CSS правил
  get cssNames(): SimpleObject {
    this.cssNamesVar.subtitle = this.backButtonLink?.length ? "subtitleWithBackButton" : "subtitle";
    this.cssNamesVar.menuList = this.floatButtonIcon?.length > 0 ? "menuListWithFloatingButton" : "menuList";
    this.cssNamesVar.helper = this.type == "short" && this.floatButtonIcon?.length > 0 ? "helperWithFloatingButton" : "helper";
    // Расчет заголовка
    {
      this.cssNamesVar.title = "title";
      // С кнопкой и аватаркой
      if ((this.backButtonLink || this.isMobile()) && (this.avatarImage || this.avatarIcon)) {
        this.cssNamesVar.title = "titleWithBackButtonAndAvatar";
      }
      // Только с кнопкой
      else if ((this.backButtonLink || this.isMobile()) && !(this.avatarImage || this.avatarIcon)) {
        this.cssNamesVar.title = "titleWithBackButton";
      }
      // Только с аватркой
      if (!(this.backButtonLink || this.isMobile()) && (this.avatarImage || this.avatarIcon)) {
        this.cssNamesVar.title = "titleWithAvatar";
      }
    }
    // Расчет подзаголовка
    {
      this.cssNamesVar.subtitle = "subtitle";
      // С кнопкой и аватаркой
      if ((this.backButtonLink || this.isMobile()) && (this.avatarImage || this.avatarIcon)) {
        this.cssNamesVar.subtitle = "subtitleWithBackButtonAndAvatar";
      }
      // Только с кнопкой
      else if ((this.backButtonLink || this.isMobile()) && !(this.avatarImage || this.avatarIcon)) {
        this.cssNamesVar.subtitle = "subtitleWithBackButton";
      }
      // Только с аватркой
      if (!(this.backButtonLink || this.isMobile()) && (this.avatarImage || this.avatarIcon)) {
        this.cssNamesVar.subtitle = "subtitleWithAvatar";
      }
    }
    // Расчет аватарки
    {
      this.cssNamesVar.avatar = "avatar";
      // С кнопкой и аватаркой
      if (this.backButtonLink || this.isMobile()) {
        this.cssNamesVar.avatar = "avatarWithBackButton";
      }
    }
    // Вернуть CSS правила
    return this.cssNamesVar;
  }

  // Высота документа для скролла
  get scrollHeight(): number {
    return Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight
    ) - this.headerHeight;
  }





  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private screenService: ScreenService,
    private menuService: MenuService
  ) {
    smoothscroll.polyfill();
    DrawDatas.dataRender();
    // Пункты меню
    this.menuItems = this.menuService.menuItems;
  }

  ngOnInit() {
    this.minHeight = DrawDatas.minHeight;
    this.maxHeight = DrawDatas.maxHeight;
    // Отрисовка
    this.onResize();
    // Объявление событий
    window.addEventListener("scroll", this.onWindowScroll.bind(this), true);
    window.addEventListener("resize", this.onResize.bind(this), true);
    window.addEventListener("mousemove", this.onMouseMove.bind(this), true);
    window.addEventListener("mouseup", this.onMouseUp.bind(this), true);
    // Скролл
    window.scroll({ top: 0 });
  }

  ngOnChanges(changes: SimpleChanges) {
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
      setTimeout(() => {
        this.tempImage = "";
        this.changeDetectorRef.detectChanges();
      }, this.clearTempImageTimeout);
    }
    // Очистить старую картинку
    else {
      this.tempImage = "";
    }
  }

  ngAfterViewInit() {
    this.minHeight = DrawDatas.minHeight;
    this.maxHeight = DrawDatas.maxHeight;
    // Отрисовка
    this.onResize();
    // Обновить
    this.changeDetectorRef.markForCheck();
  }

  ngOnDestroy() {
    window.removeEventListener("scroll", this.onWindowScroll.bind(this), true);
    window.removeEventListener("resize", this.onResize.bind(this), true);
    window.removeEventListener("mousemove", this.onMouseMove.bind(this), true);
    window.removeEventListener("mouseup", this.onMouseUp.bind(this), true);
  }





  // Скролл страницы
  private onWindowScroll(event: Event): boolean {
    let scroll: number = document?.scrollingElement?.scrollTop || 0;
    // Окончание прокрутки
    this.lastScrollTime = new Date().getTime();
    setTimeout(() => this.onWindowScrollEnd(), this.scrollTimeWait);
    // Автоколапс
    if (this.autoCollapse) {
      // Отменить блокировку скролла
      if (this.autoCollapsed) {
        //Отметиь, что коллапс сейчас не происходит
        if (scroll == 0 || scroll >= DrawDatas.maxHeight - DrawDatas.minHeight) {
          this.autoCollapsed = false;
          document.querySelectorAll("body, html").forEach(elm => elm.classList.remove("no-scroll"));
        }
      }
      // Схлопнуть меню
      else if (scroll < DrawDatas.maxHeight - DrawDatas.minHeight) {
        // Схлопнуть меню
        if (this.scroll < scroll) {
          this.collapseMenu();
        }
        // Развернуть меню
        else {
          this.expandMenu();
        }
        // Установить флажок что коллапс в процессе
        if (scroll > 0) {
          this.autoCollapsed = true;
        }
      }
      // Оменить действие по умолчанию
      event.stopPropagation();
    }
    // Разрешить скролл
    else {
      document.querySelectorAll("body, html").forEach(elm => elm.classList.remove("no-scroll"));
    }
    // Расчитать данные
    this.scroll = scroll;
    this.dataCalculate();
    // Вернуть TRUE или FALSE
    return !this.autoCollapsed;
  }

  // Скролл закончился
  private onWindowScrollEnd(): void {
    if (this.lastScrollTime + this.scrollTimeWait <= new Date().getTime()) {
      document.querySelectorAll("body, html").forEach(elm => elm.classList.remove("no-scroll"));
    }
  }

  // Изменение размеров экрана
  onResize(event?: Event): void {
    DrawDatas.type = this.type;
    DrawDatas.screenWidth = window.innerWidth;
    DrawDatas.screenHeight = window.innerHeight;
    DrawDatas.containerWidth = this.contentLayerContainer?.nativeElement?.offsetWidth || 0;
    DrawDatas.containerLeftWidth = this.contentLayerContainerLeft?.nativeElement?.offsetWidth || 0;
    // Расчет и отрисовка
    const breakpoint: ScreenKeys = this.breakpoint;
    DrawDatas.dataRender();
    this.dataCalculate();
    // Разрешить / запретить скролл
    document.querySelectorAll("body, html").forEach(elm => {
      if (this.showMobileMenu && this.isMobile()) {
        elm.classList.add("no-scroll");
      }
      else {
        elm.classList.remove("no-scroll");
      }
    });
    // Пункты меню
    if (this.breakpoint != breakpoint) {
      this.menuService.createMenuItems();
      [this.menuItems] = [this.menuService.menuItems];
      this.changeDetectorRef.detectChanges();
    }
  }

  // Фокус для скролла смахиванием
  onScrollMouseDown(event: MouseEvent): void {
    this.scrollMousePosY = event.y;
    this.scrollMouseStartY = window.scrollY;
    // Включить обнаружение движения мышкой
    this.swipeScrollPress = true;
  }

  // Движение мышкой
  onMouseMove(event: MouseEvent): void {
    if (this.swipeScrollPress) {
      this.swipeScrollDistance = event.y - this.scrollMousePosY;
      // Установить скролл
      window.scroll(0, this.scrollMouseStartY - this.swipeScrollDistance);
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
      document.querySelectorAll("body, html").forEach(elm => elm.classList.remove("no-scroll"));
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
    this.breakpoint = this.screenService.getBreakpoint(DrawDatas.screenWidth);
    // Цикл по свойствам
    for (let titleKey in this.cssNames) {
      let titleValue: string = this.cssNames[titleKey];
      this.css[titleKey] = "";
      // Свойство существует
      if (DrawDatas[titleValue as DrawDatasKeys]) {
        for (let datas of DrawDatas[titleValue as DrawDatasKeys]) {
          let sizes: DrawDataPeriod = datas.data[this.breakpoint as ScreenKeys] ?
            datas.data[this.breakpoint as ScreenKeys] as DrawDataPeriod :
            datas.data.default;
          let css: string;

          // Значение
          let value: string
          // Определить значение для заранее заданных значений
          if (sizes.value) {
            value = this.dataChoiceValue(sizes.value);
          }
          // Расчитать зависимое значение
          else {
            value = (sizes.prefixUnit ? sizes.prefixUnit : "") + this.dataCalculateFormula(sizes.max || 0, sizes.min || 0) + (sizes.unit ? sizes.unit : "");
          }

          // Установить для одного свойства
          if (typeof datas.property === "string") {
            css = datas.property + ": " + value + ";";
          }
          // Для массива свойств
          else {
            css = "";
            for (let property of datas.property) {
              css = css + property + ": " + value + ";";
            }
          }
          // Строка CSS
          this.css[titleKey] = this.css[titleKey] + css;
        }
      }
    }
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Формула расчета параметров
  private dataCalculateFormula(max: number, min: number): number {
    if (this.scroll < DrawDatas.maxHeight - DrawDatas.minHeight) {
      const koof: number = (min - max) / (DrawDatas.maxHeight - DrawDatas.minHeight);
      return (koof * this.scroll) + max;
    }

    return min;
  }

  // Выбрать значение из списка
  private dataChoiceValue(value: DrawDataValue): string {
    if (this.scroll < DrawDatas.maxHeight - DrawDatas.minHeight) {
      // Для промежуточного состояния
      if (this.scroll > 0) {
        return value.process;
      }
      // Для развернутого меню
      else {
        return value.expand;
      }
    }
    // Для схлопнутого меню
    return value.collapse;
  }

  // Проверить мобильный ли экран
  isMobile(): boolean {
    return this.screenService.getMax(this.breakpointMobile) >= DrawDatas.screenWidth;
  }





  // Переключить меню
  toggleMobileMenu(action: -1 | 1): void {
    // Открыть меню
    if (action === 1) {
      this.showMobileMenu = true;
      document.querySelectorAll("body, html").forEach(elm => elm.classList.add("no-scroll"));
    }
    // Закрыть меню
    if (action === -1) {
      this.showMobileMenu = false;
      document.querySelectorAll("body, html").forEach(elm => elm.classList.remove("no-scroll"));
    }
  }

  // Схлопнуть меню
  collapseMenu(): void {
    this.scrollTo(DrawDatas.maxHeight - DrawDatas.minHeight);
  }

  // Развернуть меню
  expandMenu(): void {
    this.scrollTo(0);
  }

  // Скролл
  private scrollTo(scroll: number): void {
    if (window.scrollY > scroll || window.scrollY < scroll) {
      document.querySelectorAll("body, html").forEach(elm => elm.classList.add("no-scroll"));
      window.scrollTo({
        behavior: "smooth",
        top: scroll
      });
    }
  }
}
