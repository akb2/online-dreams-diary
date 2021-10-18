import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { MenuItem } from "@_models/menu";
import { ScreenKeys } from "@_models/screen";
import { AccountService } from "@_services/account.service";
import { ScreenService } from "@_services/screen.service";
import { TokenService } from "@_services/token.service";





// Декоратор
@Injectable({
  providedIn: "root"
})

// Основной класс
export class MenuService {


  public menuItems: MenuItem[];
  private menuItemsOther: MenuItem[];
  private menuItemsAuth: MenuItem[];
  private menuItemsNotAuth: MenuItem[];

  private mobileBreakpoints: ScreenKeys[] = ["xsmall", "small"];





  constructor(
    private accountService: AccountService,
    private tokenService: TokenService,
    private router: Router,
    private screenService: ScreenService
  ) {
    this.createMenuItems();
  }





  // Выход из системы
  private onLogOut(): void {
    this.tokenService.deleteAuth();
  }





  // Регистрация пунктов меню
  public createMenuItems(): void {
    // Новое меню
    this.menuItems = [];
    // Загрузить пункты
    this.createMenuItemsOther();
    this.createMenuItemsAuth();
    this.createMenuItemsNotAuth();

    // Авторизованные пункты меню
    if (this.accountService.checkAuth && this.menuItemsAuth) {
      this.menuItemsAuth.map(menuItem => this.menuItems.push(menuItem));
    }
    // Неавторизованные пункты меню
    else if (!this.accountService.checkAuth && this.menuItemsNotAuth) {
      this.menuItemsNotAuth.map(menuItem => this.menuItems.push(menuItem));
    }
    // Общие пункты меню
    if (this.menuItemsOther) {
      this.menuItemsOther.map(menuItem => this.menuItems.push(menuItem));
    }

    // Отсортировать меню
    this.menuItems.sort((itemA, itemB) => this.sortMenu(itemA, itemB));
    this.menuItems.forEach(item => item?.children?.sort((itemA, itemB) => this.sortMenu(itemA, itemB)));
    // Активные элементы
    this.menuItems.forEach(item => {
      item.children?.forEach(subItem => subItem.active = this.checkActive(subItem));
      item.active = this.checkActive(item);
    });
  }

  // Общие пункты меню
  private createMenuItemsOther(): void {
    // Меню для телефона
    if (this.isMobile()) {
      this.menuItemsOther = [
        // Материалы
        {
          sort: 100,
          children: [
            // Дневники
            {
              icon: "collections_bookmark",
              text: "Дневники снов",
              link: "/diary/all"
            },
            // Блог
            {
              icon: "edit_note",
              text: "Блог",
              link: "/blog"
            },
            // Форум
            {
              icon: "forum",
              text: "Форум",
              link: "/forum"
            }
          ]
        }
      ];
    }
    // Для десктопа
    else {
      this.menuItemsOther = [
        // Материалы
        {
          sort: 100,
          icon: "help_outline",
          text: "Материалы",
          children: [
            // Дневники
            {
              icon: "book",
              text: "Дневники снов",
              link: "/diary/all"
            },
            // Разделитель
            {
              isSeparate: true
            },
            // Блог
            {
              icon: "edit_note",
              text: "Блог",
              link: "/blog"
            },
            // Разделитель
            {
              isSeparate: true
            },
            // Форум
            {
              icon: "forum",
              text: "Форум",
              link: "/forum"
            }
          ]
        }
      ];
    }
  }

  // Авторизованные пункты меню
  private createMenuItemsAuth(): void {
    // Меню для телефона
    if (this.isMobile()) {
      this.menuItemsAuth = [
        // Личный кабинет
        {
          icon: "person",
          text: "Моя страница",
          link: "/profile"
        },
        // Дневник
        {
          sort: 1,
          icon: "book",
          text: "Дневник",
          link: "/diary/my"
        },
        // Настройки
        {
          sort: 500,
          children: [
            // Настройки аккаунта
            {
              icon: "settings",
              text: "Настройки",
              link: "/profile/settings",
            },
            // Выход
            {
              icon: "exit_to_app",
              text: "Выход",
              callback: this.onLogOut.bind(this)
            }
          ]
        },
      ];
    }
    // Для десктопа
    else {
      this.menuItemsAuth = [
        // Личный кабинет
        {
          sort: 0,
          text: "Моя страница",
          link: "/profile",
          children: [
            // Настройки аккаунта
            {
              text: "Настройки",
              link: "/profile/settings",
            },
            // Выход
            {
              text: "Выход",
              callback: this.onLogOut.bind(this)
            }
          ]
        },
        // Дневник
        {
          sort: 100,
          icon: "book",
          text: "Дневник",
          link: "/diary/my"
        }
      ];
    }
  }

  // Неавторизованные пункты меню
  private createMenuItemsNotAuth(): void {
    // Меню для телефона
    if (this.isMobile()) {
      this.menuItemsNotAuth = [
        // Главная
        {
          icon: "home",
          text: "Главная",
          link: "/home"
        },
        // Личный кабинет
        {
          sort: 1000,
          children: [
            // Вход
            {
              icon: "lock",
              text: "Вход",
              link: "/auth"
            },
            // Регистрация
            {
              icon: "person_add",
              text: "Регистрация",
              link: "/register"
            }
          ]
        },
      ];
    }
    // Для десктопа
    else {
      this.menuItemsNotAuth = [
        // Главная
        {
          icon: "home",
          text: "Главная",
          link: "/home"
        },
        // Личный кабинет
        {
          sort: 1000,
          icon: "person",
          text: "Вход",
          link: "/auth",
          children: [
            // Вход
            {
              icon: "lock",
              text: "Вход",
              link: "/auth"
            },
            // Регистрация
            {
              icon: "person_add",
              text: "Регистрация",
              link: "/register"
            }
          ]
        },
      ];
    }
  }





  // Отсортировать массив меню
  private sortMenu(itemA: MenuItem, itemB: MenuItem): number {
    itemA.sort = itemA.sort || 0;
    itemB.sort = itemB.sort || 0;
    // Ничего не делать
    return itemA.sort > itemB.sort ? 1 : (itemA.sort < itemB.sort ? -1 : 0);
  }

  // Активные пункты
  private checkActive(item: MenuItem): boolean {
    let active: boolean = false;
    // Есть потомки
    if (item.children) {
      item.children?.map(subItem => active = this.checkActive(subItem) ? true : active);
    }
    // Есть ссылка
    if (item.link) {
      let url: string = this.router.url;
      url = (url.split("?"))[0];
      // Активность
      return item.link == url ? true : active;
    }
    // Не активен
    return active;
  }

  // Проверить мобильное меню или нет
  private isMobile(): boolean {
    return this.mobileBreakpoints.includes(this.screenService.getBreakpoint());
  }
}