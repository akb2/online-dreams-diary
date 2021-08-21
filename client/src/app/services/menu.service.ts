import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { MenuItem } from "@_models/menu";
import { AccountService } from "@_services/account.service";
import { TokenService } from "@_services/token.service";





// Декоратор
@Injectable({
  providedIn: "root"
})

// Основной класс
export class MenuService {


  private menuItemsOther: MenuItem[];
  private menuItemsAuth: MenuItem[];
  private menuItemsNotAuth: MenuItem[];

  constructor(
    private accountService: AccountService,
    private tokenService: TokenService,
    private router: Router
  ) {
    this.createMenuItemsOther();
    this.createMenuItemsAuth();
    this.createMenuItemsNotAuth();
  }

  public get menuItems(): MenuItem[] {
    const menuItems: MenuItem[] = [];
    // Авторизованные пункты меню
    if (this.accountService.checkAuth && this.menuItemsAuth) {
      this.menuItemsAuth.map(menuItem => menuItems.push(menuItem));
    }
    // Неавторизованные пункты меню
    else if (!this.accountService.checkAuth && this.menuItemsNotAuth) {
      this.menuItemsNotAuth.map(menuItem => menuItems.push(menuItem));
    }
    // Общие пункты меню
    if (this.menuItemsOther) {
      this.menuItemsOther.map(menuItem => menuItems.push(menuItem));
    }
    // Отсортировать меню
    menuItems.sort((itemA, itemB) => this.sortMenu(itemA, itemB));
    menuItems.forEach(item => item?.children?.sort((itemA, itemB) => this.sortMenu(itemA, itemB)));
    // Активные элементы
    menuItems.forEach(item => {
      item.children?.forEach(subItem => subItem.active = this.checkActive(subItem));
      item.active = this.checkActive(item);
    });
    // Вернуть объект
    return menuItems;
  }





  // Выход из системы
  private onLogOut(): void {
    this.tokenService.deleteAuth();
  }





  // Общие пункты меню
  private createMenuItemsOther(): void {
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
            icon: "note_alt",
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

  // Авторизованные пункты меню
  private createMenuItemsAuth(): void {
    this.menuItemsAuth = [
      // Личный кабинет
      {
        sort: 500,
        icon: "home",
        text: "Кабинет",
        link: "/profile",
        children: [
          // Настройки аккаунта
          {
            icon: "settings",
            text: "Настройки",
            link: "/profile/settings",
          },
          // Разделитель
          {
            isSeparate: true
          },
          // Выход
          {
            icon: "exit_to_app",
            text: "Выход",
            callback: this.onLogOut.bind(this)
          }
        ]
      },
      // Дневник
      {
        icon: "book",
        text: "Дневник",
        link: "/diary/my"
      }
    ];
  }

  // Неавторизованные пункты меню
  private createMenuItemsNotAuth(): void {
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
        text: "Кабинет",
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
}


/*

      // * Авторизованное меню
      // Группа аккаунта
      [
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
*/