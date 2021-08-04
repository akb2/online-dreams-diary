import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MenuItem } from "@_models/menu";
import { AccountService } from "@_services/account.service";
import { ScreenKeys, ScreenService } from "@_services/screen.service";





@Component({
  selector: "app-main-menu",
  templateUrl: "./nav-menu.component.html",
  styleUrls: ["./nav-menu.component.scss"]
})





// Основной класс
export class NavMenuComponent implements OnInit, AfterViewInit, OnDestroy {


  @Input() public type: "full" | "short" | "collapse" = "collapse";
  @Input() public image: string = "";
  @Input() public class: string = "";
  @Input() public autoCollapse: boolean = false;
  @Input() public imagePositionX: string = "center";
  @Input() public imagePositionY: string = "center";
  @Input() public imageOverlay: boolean = true;

  @Input() public title: string = "";
  @Input() public subTitle: string = "";
  @Input() public avatarImage: string = "";
  @Input() public avatarIcon: string = "";

  @Input() public floatButtonIcon: string = "";
  @Input() public floatButtonText: string = "";
  @Input() public floatButtonCallback: Function;
  @Input() public floatButtonLink: string;
  @Input() public floatButtonLinkParams: { [key: string]: string };

  @Input() public backButtonLink: string;
  @Input() public backButtonLinkParams: { [key: string]: string };

  @Input() public hideToContentButton: boolean = false;

  @ViewChild("contentLayerContainer") private contentLayerContainer: ElementRef;
  @ViewChild("contentLayerContainerLeft") private contentLayerContainerLeft: ElementRef;

  private autoCollapsed: boolean = false;
  private scroll: number = 0;
  private breakpoint: string = "default";
  public breakpointMobile: string = "small";
  public headerHeight: number = DrawDatas.minHeight;

  public showMobileMenu: boolean = false;
  public menuItems: MenuItem[][] = [];
  public minHeight: number = 0;
  public maxHeight: number = 0;

  private scrollMousePosY: number = 0;
  private scrollMouseStartY: number = 0;
  private swipeScrollDistance: number = 0;
  private swipeScrollPress: boolean = false;
  private lastScrollTime: number = new Date().getTime();
  private scrollTimeWait: number = 150;

  public css: { [key: string]: string } = {};

  private cssNamesVar: { [key: string]: string } = {
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
  get cssNames(): { [key: string]: string } {
    this.cssNamesVar.subtitle = this.backButtonLink?.length ? "subtitleWithBackButton" : "subtitle";
    this.cssNamesVar.menuList = this.floatButtonLink?.length || this.floatButtonCallback ? "menuListWithFloatingButton" : "menuList";
    this.cssNamesVar.helper = this.type == "short" && (this.floatButtonLink?.length || this.floatButtonCallback) ? "helperWithFloatingButton" : "helper";
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

  // Конструктор
  constructor(
    private screenService: ScreenService,
    public accountService: AccountService
  ) {
    DrawDatas.dataRender();
    // Пункты меню
    this.menuItems = [
      // * Авторизованное меню
      // Группа аккаунта
      [
        // Личный кабинет
        {
          auth: 1,
          icon: "home",
          text: "Кабинет",
          link: "/cabinet"
        },
        // Мой дневник сновидений
        {
          auth: 1,
          icon: "book",
          text: "Мой дневник",
          link: "/my-diary"
        },
      ],
      // Группа общих разделов
      [
        // Общий дневник
        {
          auth: 1,
          icon: "collections_bookmark",
          text: "Все дневники",
          link: "/diaries"
        },
        // Блог
        {
          auth: 1,
          icon: "edit",
          text: "Блог",
          link: "/blog"
        },
        // Форум
        {
          auth: 1,
          icon: "forum",
          text: "Форум",
          link: "/forum"
        }
      ],
      // Аккаунт
      [
        // Выход
        {
          auth: 1,
          icon: "exit_to_app",
          text: "Выход",
          callback: this.onLogOut.bind(this)
        },
      ],
      // * Неавторизованное меню
      // Главная группа
      [
        // Главная страница
        {
          auth: -1,
          icon: "home",
          text: "Главная",
          link: "/home"
        },
      ],
      // Группа авторизации
      [
        // Вход
        {
          auth: -1,
          icon: "lock",
          text: "Вход",
          link: "/auth"
        },
        // Регистрация
        {
          auth: -1,
          icon: "person_add",
          text: "Регистрация",
          link: "/register"
        },
      ],
    ];
  }





  // Запуск класса
  public ngOnInit(): void {
    this.onResize();

    window.addEventListener("scroll", this.onWindowScroll.bind(this), true);
    window.addEventListener("resize", this.onResize.bind(this), true);
    window.addEventListener("mousemove", this.onMouseMove.bind(this), true);
    window.addEventListener("mouseup", this.onMouseUp.bind(this), true);
    window.scroll({ top: 0 });

    this.minHeight = DrawDatas.minHeight;
    this.maxHeight = DrawDatas.maxHeight;
  }

  // Запуск класса
  public ngAfterViewInit(): void {
    this.onResize();
    this.minHeight = DrawDatas.minHeight;
    this.maxHeight = DrawDatas.maxHeight;
  }

  // Конец класса
  public ngOnDestroy(): void {
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
  public onResize(event?: Event): void {
    DrawDatas.type = this.type;
    DrawDatas.screenWidth = window.innerWidth;
    DrawDatas.screenHeight = window.innerHeight;
    DrawDatas.containerWidth = this.contentLayerContainer?.nativeElement?.offsetWidth || 0;
    DrawDatas.containerLeftWidth = this.contentLayerContainerLeft?.nativeElement?.offsetWidth || 0;

    DrawDatas.dataRender();
    this.dataCalculate();


    document.querySelectorAll("body, html").forEach(elm => {
      if (this.showMobileMenu && this.isMobile()) {
        elm.classList.add("no-scroll");
      }
      else {
        elm.classList.remove("no-scroll");
      }
    });
  }

  // Фокус для скролла смахиванием
  public onScrollMouseDown(event: MouseEvent): void {
    this.scrollMousePosY = event.y;
    this.scrollMouseStartY = window.scrollY;
    // Включить обнаружение движения мышкой
    this.swipeScrollPress = true;
  }

  // Движение мышкой
  public onMouseMove(event: MouseEvent): void {
    if (this.swipeScrollPress) {
      this.swipeScrollDistance = event.y - this.scrollMousePosY;
      // Установить скролл
      window.scroll(0, this.scrollMouseStartY - this.swipeScrollDistance);
    }
  }

  // Потеря фокуса любым элементом
  public onMouseUp(event: MouseEvent): void {
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

  // Выход из системы
  public onLogOut(): void {
    this.accountService.deleteAuth();
  }






  // Расчет параметров шапки
  private dataCalculate(): void {
    this.breakpoint = this.screenService.getBreakpoint(DrawDatas.screenWidth);
    // Цикл по свойствам
    for (let titleKey in this.cssNames) {
      let titleValue: string = this.cssNames[titleKey];
      this.css[titleKey] = "";

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
  public isMobile(): boolean {
    return this.screenService.getMax(this.breakpointMobile) >= DrawDatas.screenWidth;
  }

  // Проверить есть ли доступные пункты
  public hasAvailMenuItem(menuItems: MenuItem[]): boolean {
    return menuItems.some(menuItem =>
      (menuItem.auth == 1 && this.accountService.checkAuth) ||
      (menuItem.auth == -1 && !this.accountService.checkAuth) ||
      menuItem.auth == 0
    );
  }





  // Переключить меню
  public toggleMobileMenu(action: -1 | 1): void {
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
  public collapseMenu(): void {
    this.scrollTo(DrawDatas.maxHeight - DrawDatas.minHeight);
  }

  // Развернуть меню
  public expandMenu(): void {
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





// Класс с параметрами
class DrawDatas {
  public static type: "full" | "short" | "collapse" = "collapse";
  public static minHeight: number = 60;
  public static screenWidth: number = 0;
  public static screenHeight: number = 0;
  public static containerWidth: number = 0;
  public static containerLeftWidth: number = 0;
  private static shortHeight: number = 420;


  public static menu: DrawInterface[];
  public static menuList: DrawInterface[];
  public static menuListWithFloatingButton: DrawInterface[];
  public static menuItem: DrawInterface[];
  public static menuItemLine: DrawInterface[];
  public static helper: DrawInterface[];
  public static helperWithFloatingButton: DrawInterface[];
  public static header: DrawInterface[];
  public static scroll: DrawInterface[];
  public static title: DrawInterface[];
  public static titleWithBackButton: DrawInterface[];
  public static titleWithBackButtonAndAvatar: DrawInterface[];
  public static titleWithAvatar: DrawInterface[];
  public static subtitle: DrawInterface[];
  public static subtitleWithBackButton: DrawInterface[];
  public static subtitleWithBackButtonAndAvatar: DrawInterface[];
  public static subtitleWithAvatar: DrawInterface[];
  public static avatar: DrawInterface[];
  public static avatarWithBackButton: DrawInterface[];
  public static floatingButton: DrawInterface[];
  public static floatingButtonOverlay: DrawInterface[];
  public static backButton: DrawInterface[];
  public static toContentButton: DrawInterface[];





  // Заполнение данных
  public static dataRender(): void {
    DrawDatas.menu = [{
      property: "height",
      data: {
        default: { min: DrawDatas.minHeight, max: DrawDatas.maxHeight, unit: "px" }
      }
    }];
    DrawDatas.menuItem = [{
      property: "font-size",
      data: {
        default: { min: 13, max: 18, unit: "px" },
        middle: { min: 13, max: 16, unit: "px" },
        large: { min: 13, max: 16, unit: "px" }
      }
    }, {
      property: "line-height",
      data: {
        default: { min: 60, max: 60, unit: "px" },
        middle: { min: 40, max: 60, unit: "px" },
        large: { min: 40, max: 60, unit: "px" }
      }
    }, {
      property: "margin-top",
      data: {
        default: { min: 0, max: 15, unit: "px" },
        middle: { min: 10, max: 15, unit: "px" },
        large: { min: 10, max: 15, unit: "px" }
      }
    }, {
      property: ["padding-left", "padding-right"],
      data: {
        default: { min: 20, max: 32, unit: "px" },
        middle: { min: 16, max: 10, unit: "px" },
        large: { min: 16, max: 16, unit: "px" }
      }
    }];
    DrawDatas.menuItemLine = [{
      property: "height",
      data: {
        default: { min: 60, max: 3, unit: "px" },
        middle: { min: 40, max: 2, unit: "px" },
        large: { min: 40, max: 2, unit: "px" }
      }
    }];

    DrawDatas.menuList = [{
      property: "right",
      data: {
        default: { min: -75, max: -75, unit: "px" }
      }
    }];
    DrawDatas.menuListWithFloatingButton = [{
      property: "right",
      data: {
        default: { min: 0, max: -75, unit: "px" }
      }
    }];

    DrawDatas.helper = [{
      property: "height",
      data: {
        default: { min: DrawDatas.maxHeight, max: DrawDatas.maxHeight, unit: "px" }
      }
    }];
    DrawDatas.helperWithFloatingButton = [];
    Object.assign(DrawDatas.helperWithFloatingButton, DrawDatas.helper);
    DrawDatas.helperWithFloatingButton.push({
      property: "margin-bottom",
      data: {
        default: { min: 0, max: 0, unit: "px" },
        middle: { min: 0, max: 45, unit: "px" },
        small: { min: 0, max: 38, unit: "px" },
        xsmall: { min: 0, max: 38, unit: "px" }
      }
    });

    DrawDatas.header = [{
      property: "opacity",
      data: {
        default: { min: 1, max: 0 }
      }
    }];

    DrawDatas.scroll = [{
      property: "height",
      data: {
        default: { min: DrawDatas.screenHeight - DrawDatas.minHeight, max: DrawDatas.screenHeight - DrawDatas.maxHeight, unit: "px" }
      }
    }];

    // Заголовок
    DrawDatas.title = [{
      property: "font-size",
      data: {
        default: { min: 15, max: 70, unit: "px" },
        large: { min: 15, max: 60, unit: "px" },
        middle: { min: 15, max: 48, unit: "px" },
        small: { min: 15, max: 32, unit: "px" },
        xsmall: { min: 15, max: 24, unit: "px" },
      }
    }, {
      property: "line-height",
      data: {
        default: { min: 20, max: 90, unit: "px" },
        large: { min: 20, max: 76, unit: "px" },
        middle: { min: 20, max: 60, unit: "px" },
        small: { min: 20, max: 40, unit: "px" },
        xsmall: { min: 20, max: 32, unit: "px" },
      }
    }];
    // Заголовок с кнопкой меню или назад
    DrawDatas.titleWithBackButton = [];
    Object.assign(DrawDatas.titleWithBackButton, DrawDatas.title);
    DrawDatas.titleWithBackButton.push({
      property: "margin-left",
      data: {
        default: { min: DrawDatas.minHeight, max: 0, unit: "px" },
        middle: { min: DrawDatas.minHeight, max: 30, unit: "px" },
        small: { min: DrawDatas.minHeight, max: 15, unit: "px" },
        xsmall: { min: DrawDatas.minHeight, max: 15, unit: "px" }
      }
    }, {
      property: "width",
      data: {
        default: { min: DrawDatas.containerLeftWidth - DrawDatas.minHeight, max: DrawDatas.containerWidth, unit: "px" },
        small: { min: DrawDatas.containerWidth - (DrawDatas.minHeight * 2), max: DrawDatas.containerWidth - 30, unit: "px" },
        xsmall: { min: DrawDatas.containerWidth - (DrawDatas.minHeight * 2), max: DrawDatas.containerWidth - 30, unit: "px" },
      }
    });
    // Заголовок с аватаркой
    DrawDatas.titleWithAvatar = [];
    Object.assign(DrawDatas.titleWithAvatar, DrawDatas.title);
    DrawDatas.titleWithAvatar.push({
      property: "margin-left",
      data: {
        default: { min: 48, max: 192, unit: "px" },
        large: { min: 48, max: 150, unit: "px" },
        middle: { min: 48, max: 112, unit: "px" },
        small: { min: 48, max: 85, unit: "px" },
        xsmall: { min: 48, max: 73, unit: "px" },
      }
    }, {
      property: "width",
      data: {
        default: { min: DrawDatas.containerLeftWidth - 48, max: DrawDatas.containerWidth - 192, unit: "px" },
        large: { min: DrawDatas.containerLeftWidth - 48, max: DrawDatas.containerWidth - 150, unit: "px" },
        middle: { min: DrawDatas.containerLeftWidth - 48, max: DrawDatas.containerWidth - 112, unit: "px" },
      }
    });
    // Заголовок с аватаркой и кнопкой
    DrawDatas.titleWithBackButtonAndAvatar = [];
    Object.assign(DrawDatas.titleWithBackButtonAndAvatar, DrawDatas.title);
    DrawDatas.titleWithBackButtonAndAvatar.push({
      property: "margin-left",
      data: {
        default: { min: DrawDatas.minHeight + 48, max: 192, unit: "px" },
        large: { min: 113, max: 153, unit: "px" },
        middle: { min: 113, max: 105, unit: "px" },
        small: { min: 113, max: 90, unit: "px" },
        xsmall: { min: 113, max: 78, unit: "px" },
      }
    }, {
      property: "width",
      data: {
        default: { min: DrawDatas.containerLeftWidth - (DrawDatas.minHeight + 48), max: DrawDatas.containerWidth - 192, unit: "px" },
        large: { min: DrawDatas.containerLeftWidth - 113, max: DrawDatas.containerWidth - 153, unit: "px" },
        middle: { min: DrawDatas.containerLeftWidth - 113, max: DrawDatas.containerWidth - 105, unit: "px" },
        small: { min: DrawDatas.containerWidth - 113 - 60, max: DrawDatas.containerWidth - 90 - 15, unit: "px" },
        xsmall: { min: DrawDatas.containerWidth - 113 - 60, max: DrawDatas.containerWidth - 78 - 15, unit: "px" },
      }
    });
    // Отступ и ширина заголовка
    DrawDatas.title.push({
      property: "margin-left",
      data: {
        default: { min: 0, max: 0, unit: "px" }
      }
    }, {
      property: "width",
      data: {
        default: { min: DrawDatas.containerLeftWidth, max: DrawDatas.containerWidth, unit: "px" },
      }
    });

    // Подзаголовок
    DrawDatas.subtitle = [{
      property: "font-size",
      data: {
        default: { min: 13, max: 40, unit: "px" },
        xsmall: { min: 13, max: 16, unit: "px" },
        small: { min: 13, max: 20, unit: "px" },
        middle: { min: 13, max: 24, unit: "px" },
        large: { min: 13, max: 32, unit: "px" }
      }
    }, {
      property: "line-height",
      data: {
        default: { min: 18, max: 52, unit: "px" },
        xsmall: { min: 18, max: 22, unit: "px" },
        small: { min: 18, max: 30, unit: "px" },
        middle: { min: 18, max: 32, unit: "px" },
        large: { min: 18, max: 40, unit: "px" }
      }
    }];
    // Подзаголовок с кнопкой меню или назад
    DrawDatas.subtitleWithBackButton = [];
    Object.assign(DrawDatas.subtitleWithBackButton, DrawDatas.subtitle);
    DrawDatas.subtitleWithBackButton.push({
      property: "margin-left",
      data: {
        default: { min: DrawDatas.minHeight, max: 0, unit: "px" },
        middle: { min: DrawDatas.minHeight, max: 30, unit: "px" },
        small: { min: DrawDatas.minHeight, max: 15, unit: "px" },
        xsmall: { min: DrawDatas.minHeight, max: 15, unit: "px" }
      }
    }, {
      property: "width",
      data: {
        default: { min: DrawDatas.containerLeftWidth - DrawDatas.minHeight, max: DrawDatas.containerWidth, unit: "px" },
        small: { min: DrawDatas.containerWidth - (DrawDatas.minHeight * 2), max: DrawDatas.containerWidth - 30, unit: "px" },
        xsmall: { min: DrawDatas.containerWidth - (DrawDatas.minHeight * 2), max: DrawDatas.containerWidth - 30, unit: "px" },
      }
    });
    // Подзаголовок с аватаркой
    DrawDatas.subtitleWithAvatar = [];
    Object.assign(DrawDatas.subtitleWithAvatar, DrawDatas.subtitle);
    DrawDatas.subtitleWithAvatar.push({
      property: "margin-left",
      data: {
        default: { min: 48, max: 192, unit: "px" },
        xsmall: { min: 48, max: 73, unit: "px" },
        small: { min: 48, max: 85, unit: "px" },
        middle: { min: 48, max: 112, unit: "px" },
        large: { min: 48, max: 150, unit: "px" }
      }
    }, {
      property: "width",
      data: {
        default: { min: DrawDatas.containerLeftWidth - 48, max: DrawDatas.containerWidth - 192, unit: "px" },
        large: { min: DrawDatas.containerLeftWidth - 48, max: DrawDatas.containerWidth - 150, unit: "px" },
        middle: { min: DrawDatas.containerLeftWidth - 48, max: DrawDatas.containerWidth - 112, unit: "px" },
      }
    });
    // Подзаголовок с аватаркой и кнопкой
    DrawDatas.subtitleWithBackButtonAndAvatar = [];
    Object.assign(DrawDatas.subtitleWithBackButtonAndAvatar, DrawDatas.subtitle);
    DrawDatas.subtitleWithBackButtonAndAvatar.push({
      property: "margin-left",
      data: {
        default: { min: DrawDatas.minHeight + 48, max: 192, unit: "px" },
        xsmall: { min: 113, max: 78, unit: "px" },
        small: { min: 113, max: 90, unit: "px" },
        middle: { min: 113, max: 105, unit: "px" },
        large: { min: 113, max: 153, unit: "px" },
      }
    }, {
      property: "width",
      data: {
        default: { min: DrawDatas.containerLeftWidth - (DrawDatas.minHeight + 48), max: DrawDatas.containerWidth - 192, unit: "px" },
        large: { min: DrawDatas.containerLeftWidth - 113, max: DrawDatas.containerWidth - 153, unit: "px" },
        middle: { min: DrawDatas.containerLeftWidth - 113, max: DrawDatas.containerWidth - 105, unit: "px" },
        small: { min: DrawDatas.containerWidth - 113 - 60, max: DrawDatas.containerWidth - 90 - 15, unit: "px" },
        xsmall: { min: DrawDatas.containerWidth - 113 - 60, max: DrawDatas.containerWidth - 78 - 15, unit: "px" },
      }
    });
    // Отступ подзаголовка
    DrawDatas.subtitle.push({
      property: "margin-left",
      data: {
        default: { min: 0, max: 0, unit: "px" }
      }
    }, {
      property: "width",
      data: {
        default: { min: DrawDatas.containerLeftWidth, max: DrawDatas.containerWidth, unit: "px" },
      }
    });

    // Аватарка
    DrawDatas.avatar = [{
      property: ["width", "height", "line-height"],
      data: {
        default: { min: 38, max: 152, unit: "px" },
        xsmall: { min: 38, max: 48, unit: "px" },
        small: { min: 38, max: 60, unit: "px" },
        middle: { min: 38, max: 84, unit: "px" },
        large: { min: 38, max: 118, unit: "px" }
      }
    }, {
      property: "font-size",
      data: {
        default: { min: 28, max: 114, unit: "px" },
        xsmall: { min: 28, max: 36, unit: "px" },
        small: { min: 28, max: 45, unit: "px" },
        middle: { min: 28, max: 63, unit: "px" },
        large: { min: 28, max: 88, unit: "px" }
      }
    }, {
      property: "left",
      data: {
        default: { min: 0, max: 0, unit: "px" }
      }
    }];
    // Аватарка с кнопкой назад или меню
    DrawDatas.avatarWithBackButton = [];
    Object.assign(DrawDatas.avatarWithBackButton, DrawDatas.avatar);
    DrawDatas.avatarWithBackButton.push({
      property: "left",
      data: {
        default: { min: DrawDatas.minHeight, max: 0, unit: "px" },
        small: { min: DrawDatas.minHeight, max: 15, unit: "px" },
        xsmall: { min: DrawDatas.minHeight, max: 15, unit: "px" },
      }
    });

    DrawDatas.floatingButton = [{
      property: ["width", "min-width", "height", "line-height"],
      data: {
        default: { min: 60, max: 90, unit: "px" },
        small: { min: 60, max: 76, unit: "px" },
        xsmall: { min: 60, max: 76, unit: "px" }
      }
    }, {
      property: "font-size",
      data: {
        default: { min: 24, max: 48, unit: "px" },
        small: { min: 24, max: 36, unit: "px" },
        xsmall: { min: 24, max: 36, unit: "px" }
      }
    }, {
      property: "margin-bottom",
      data: {
        default: { min: 0, max: (DrawDatas.type == "short" ? -45 : 15), unit: "px" },
        small: { min: 0, max: (DrawDatas.type == "short" ? -38 : 15), unit: "px" },
        xsmall: { min: 0, max: (DrawDatas.type == "short" ? -38 : 15), unit: "px" }
      }
    }, {
      property: "margin-right",
      data: {
        default: { min: 0, max: 0, unit: "px" },
        small: { min: 0, max: 15, unit: "px" },
        xsmall: { min: 0, max: 15, unit: "px" }
      }
    }];
    DrawDatas.floatingButtonOverlay = [{
      property: "opacity",
      data: {
        default: { min: 0, max: 1 }
      }
    }];

    DrawDatas.backButton = [{
      property: "top",
      data: {
        default: { min: 0, max: 15, unit: "px" }
      }
    }, {
      property: "margin-left",
      data: {
        default: { min: 0, max: 0, unit: "px" },
        small: { min: 0, max: 15, unit: "px" },
        xsmall: { min: 0, max: 15, unit: "px" }
      }
    }, {
      property: "font-size",
      data: {
        default: { min: 32, max: 48, unit: "px" },
        small: { min: 24, max: 48, unit: "px" },
        xsmall: { min: 24, max: 48, unit: "px" }
      }
    }];

    DrawDatas.toContentButton = [{
      property: ["width", "height", "line-height"],
      data: {
        default: { min: 0, max: 90, unit: "px" },
        small: { min: 0, max: 70, unit: "px" },
        xsmall: { min: 0, max: 60, unit: "px" }
      }
    }, {
      property: "font-size",
      data: {
        default: { min: 0, max: 68, unit: "px" },
        small: { min: 0, max: 52, unit: "px" },
        xsmall: { min: 0, max: 40, unit: "px" }
      }
    }, {
      property: "margin-bottom",
      data: {
        default: { min: 0, max: 15, unit: "px" },
        small: { min: 0, max: 10, unit: "px" },
        xsmall: { min: 0, max: 5, unit: "px" }
      }
    }, {
      property: "opacity",
      data: {
        default: { min: 0, max: 1, unit: "px" }
      }
    }];
  }

  // Допустимая максимальная высота шапки
  static get maxHeight(): number {
    if (DrawDatas.type == "full") {
      return DrawDatas.screenHeight;
    }

    else if (DrawDatas.type == "short") {
      return DrawDatas.screenHeight > DrawDatas.shortHeight ? DrawDatas.shortHeight : DrawDatas.screenHeight;
    }

    return DrawDatas.minHeight;
  }
}





// Данные для параметров
interface DrawInterface {
  property: string | string[];
  data: DrawData;
}

// Данные для отрисовки
interface DrawData {
  default: DrawDataPeriod;
  xsmall?: DrawDataPeriod;
  small?: DrawDataPeriod;
  middle?: DrawDataPeriod;
  large?: DrawDataPeriod;
  xlarge?: DrawDataPeriod;
}

// Данные размеров
interface DrawDataPeriod {
  min?: number;
  max?: number;
  value?: DrawDataValue;
  unit?: string;
  prefixUnit?: string;
}

// Данные размеров
interface DrawDataPeriod {
  min?: number;
  max?: number;
  value?: DrawDataValue;
  unit?: string;
}

// Интерфейс выбора заранее заданных значений
interface DrawDataValue {
  expand: string;
  process: string;
  collapse: string;
}

// Типы стилей для DrawDatas
type DrawDatasKeys =
  "menu" |
  "menuList" |
  "menuListWithFloatingButton" |
  "menuItem" |
  "menuItemLine" |
  "helper" |
  "helperWithFloatingButton" |
  "header" |
  "scroll" |
  "title" |
  "titleWithBackButton" |
  "avatar" |
  "subtitle" |
  "subtitleWithBackButton" |
  "floatingButton" |
  "floatingButtonOverlay" |
  "backButton" |
  "toContentButton"
  ;
