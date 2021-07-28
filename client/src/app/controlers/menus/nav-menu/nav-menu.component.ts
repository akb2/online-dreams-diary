import { Component, Input, OnDestroy, OnInit, HostListener } from "@angular/core";
import { HammerGestureConfig, HammerLoader } from "@angular/platform-browser";
import { ScreenService } from "@_services/screen.service";





@Component({
  selector: "app-main-menu",
  templateUrl: "./nav-menu.component.html",
  styleUrls: ["./nav-menu.component.scss"]
})





// Основной класс
export class NavMenuComponent implements OnInit, OnDestroy {


  @Input() public type: "full" | "short" | "collapse" = "collapse";
  @Input() public image: string = "";
  @Input() public class: string = "";
  @Input() public title: string = "";
  @Input() public subTitle: string = "";
  @Input() public autoCollapse: boolean = false;

  @Input() public floatButtonIcon: string = "";
  @Input() public floatButtonCallback: Function;
  @Input() public floatButtonLink: string;
  @Input() public floatButtonLinkParams: { [key: string]: string };

  @Input() public backButtonLink: string;
  @Input() public backButtonLinkParams: { [key: string]: string };

  @Input() public hideToContentButton: boolean = false;

  private autoCollapsed: boolean = false;
  private scroll: number = 0;
  private breakpoint: string = "default";
  public breakpointMobile: string = "small";
  public headerHeight: number = DrawDatas.minHeight;

  public showMobileMenu: boolean = false;
  public menuItems: MenuItems[] = [{
    auth: 1,
    icon: "home",
    text: "Главная",
    link: "/"
  }, {
    auth: 1,
    icon: "person_add",
    text: "Регистрация",
    link: "/register"
  }, {
    auth: 1,
    icon: "lock",
    text: "Вход",
    link: "/auth"
  }];

  public css: { [key: string]: string } = {};
  private cssNamesVar: { [key: string]: string } = {
    menu: "menu",
    menuList: "",
    menuItem: "menuItem",
    menuItemLine: "menuItemLine",
    helper: "",
    header: "header",
    scroll: "scroll",
    title: "",
    subtitle: "",
    floatingButton: "floatingButton",
    floatingButtonOverlay: "floatingButtonOverlay",
    backButton: "backButton",
    toContentButton: "toContentButton"
  };
  get cssNames(): { [key: string]: string } {
    this.cssNamesVar.title = this.backButtonLink?.length > 0 ? "titleWithBackButton" : "title";
    this.cssNamesVar.subtitle = this.backButtonLink?.length > 0 ? "subtitleWithBackButton" : "subtitle";
    this.cssNamesVar.menuList = this.floatButtonLink?.length > 0 || this.floatButtonCallback ? "menuListWithFloatingButton" : "menuList";
    this.cssNamesVar.helper = this.type == "short" && (this.floatButtonLink?.length > 0 || this.floatButtonCallback) ? "helperWithFloatingButton" : "helper";

    return this.cssNamesVar;
  }





  // Конструктор
  constructor(
    private screenService: ScreenService
  ) {
    DrawDatas.dataRender();
  }





  // Запуск класса
  public ngOnInit(): void {
    this.onResize();

    window.addEventListener("scroll", this.onWindowScroll.bind(this), true);
    window.addEventListener("swipeleft", this.onSwipe.bind(this), true);
    window.addEventListener("swiperight", this.onSwipe.bind(this), true);
    window.addEventListener("resize", this.onResize.bind(this), true);
    window.scroll({ top: 0 });
  }

  // Конец класса
  public ngOnDestroy(): void {
    window.removeEventListener("scroll", this.onWindowScroll.bind(this), true);
    window.removeEventListener("swipeleft", this.onSwipe.bind(this), true);
    window.removeEventListener("swiperight", this.onSwipe.bind(this), true);
    window.removeEventListener("resize", this.onResize.bind(this), true);
  }

  // Скролл страницы
  private onWindowScroll(event: Event): boolean {
    // Автоколапс
    if (this.autoCollapse) {
      let scroll: number = document.scrollingElement.scrollTop;

      // Отменить блокировку скролла
      if (this.autoCollapsed) {
        //Отметиь, что коллапс сейчас не происходит
        if (scroll == 0 || scroll >= DrawDatas.maxHeight - DrawDatas.minHeight) {
          this.autoCollapsed = false;
        }
        // Убрать блокировку скролла
        if (scroll == 0 || scroll >= DrawDatas.maxHeight - DrawDatas.minHeight) {
          document.querySelectorAll("body, html").forEach(elm => elm.classList.remove("no-scroll"));
        }
      }

      // Схлопнуть меню
      else if (scroll < DrawDatas.maxHeight - DrawDatas.minHeight) {

        // Схлопнуть меню
        if (this.scroll < scroll) {
          this.collapseMenu();
        }

        else {
          this.expandMenu();
        }

        if (scroll > 0) {
          this.autoCollapsed = true;
        }
      }

      event.stopPropagation();
    }

    else {
      document.querySelectorAll("body, html").forEach(elm => elm.classList.remove("no-scroll"));
    }



    this.scroll = document.scrollingElement.scrollTop;
    this.dataCalculate();
    return !this.autoCollapsed;
  }

  // Изменение размеров экрана
  public onResize(event?: Event): void {
    DrawDatas.type = this.type;
    DrawDatas.screenWidth = window.innerWidth;
    DrawDatas.screenHeight = window.innerHeight;

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

  // Свайп экрана
  private onSwipe(event?): void {
    console.log(event);
  }






  // Расчет параметров шапки
  private dataCalculate(): void {
    this.breakpoint = this.screenService.getBreakpoint(DrawDatas.screenWidth);

    for (let titleKey in this.cssNames) {
      let titleValue: string = this.cssNames[titleKey];
      this.css[titleKey] = "";

      if (DrawDatas[titleValue]) {
        for (let datas of DrawDatas[titleValue]) {
          let sizes: DrawDataPeriod = datas.data[this.breakpoint] ? datas.data[this.breakpoint] : datas.data.default;
          let calc: number = this.dataCalculateFormula(sizes.max, sizes.min);
          let css: string;

          if (typeof datas.property === "string") { css = datas.property + ": " + calc + (sizes.unit ? sizes.unit : "") + ";"; }
          else {
            css = "";
            for (let property of datas.property) {
              css = css + property + ": " + calc + (sizes.unit ? sizes.unit : "") + ";";
            }
          }

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

  // Проверить мобильный ли экран
  public isMobile(): boolean {
    return this.screenService.getMax(this.breakpointMobile) >= DrawDatas.screenWidth;
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
    document.querySelectorAll("body, html").forEach(elm => elm.classList.add("no-scroll"));
    window.scroll({
      behavior: "smooth",
      top: scroll
    });
  }
}





// Класс с параметрами
class DrawDatas {
  public static type: "full" | "short" | "collapse" = "collapse";
  public static minHeight: number = 60;
  public static screenWidth: number = 0;
  public static screenHeight: number = 0;
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
  public static subtitle: DrawInterface[];
  public static subtitleWithBackButton: DrawInterface[];
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

    DrawDatas.title = [{
      property: "font-size",
      data: {
        default: { min: 15, max: 80, unit: "px" },
        xsmall: { min: 15, max: 24, unit: "px" },
        small: { min: 15, max: 32, unit: "px" },
        middle: { min: 15, max: 48, unit: "px" },
        large: { min: 15, max: 60, unit: "px" }
      }
    }, {
      property: "line-height",
      data: {
        default: { min: 20, max: 100, unit: "px" },
        xsmall: { min: 20, max: 32, unit: "px" },
        small: { min: 20, max: 40, unit: "px" },
        middle: { min: 20, max: 60, unit: "px" },
        large: { min: 20, max: 76, unit: "px" }
      }
    }];
    DrawDatas.titleWithBackButton = [];
    Object.assign(DrawDatas.titleWithBackButton, DrawDatas.title);
    DrawDatas.title.push({
      property: "margin-left",
      data: {
        default: { min: 0, max: 0, unit: "px" },
        small: { min: DrawDatas.minHeight, max: 30, unit: "px" },
        xsmall: { min: DrawDatas.minHeight, max: 30, unit: "px" }
      }
    });
    DrawDatas.titleWithBackButton.push({
      property: "margin-left",
      data: {
        default: { min: DrawDatas.minHeight, max: 0, unit: "px" },
        small: { min: DrawDatas.minHeight, max: 30, unit: "px" },
        xsmall: { min: DrawDatas.minHeight, max: 30, unit: "px" }
      }
    });

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
    DrawDatas.subtitleWithBackButton = [];
    Object.assign(DrawDatas.subtitleWithBackButton, DrawDatas.subtitle);
    DrawDatas.subtitle.push({
      property: "margin-left",
      data: {
        default: { min: 0, max: 0, unit: "px" },
        small: { min: DrawDatas.minHeight, max: 30, unit: "px" },
        xsmall: { min: DrawDatas.minHeight, max: 30, unit: "px" }
      }
    });
    DrawDatas.subtitleWithBackButton.push({
      property: "margin-left",
      data: {
        default: { min: DrawDatas.minHeight, max: 0, unit: "px" },
        small: { min: DrawDatas.minHeight, max: 30, unit: "px" },
        xsmall: { min: DrawDatas.minHeight, max: 30, unit: "px" }
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
  min: number;
  max: number;
  unit?: string;
}

// Элемент главного меню
interface MenuItems {
  auth: -1 | 0 | 1;
  icon: string;
  text: string;
  callback?: Function;
  link?: string;
  linkParams?: { [key: string]: string };
}
