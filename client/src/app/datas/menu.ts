import { MenuItem, MenuItemsListDevices } from "@_models/menu";
import { Language } from "@_models/translate";





// Разделитель
const Separator: MenuItem = { isSeparate: true };

// Список пунктов меню
export const MenuItems: MenuItemsListDevices = {
  // Для больших экранов
  desktop: {
    // Для всех пользователей
    any: [
      // Поиск
      {
        sort: 100,
        text: "menus.nav_menu.items.search",
        link: "/search",
        children: [
          // Люди
          {
            text: "menus.nav_menu.items.search_people",
            link: "/people"
          },
          // Разделитель
          {
            isSeparate: true
          },
          // Дневники
          {
            text: "menus.nav_menu.items.search_dreams",
            link: "/diary/all"
          },
          // // Разделитель
          // {
          //   isSeparate: true
          // },
          // // Блог
          // {
          //   text: "Блог",
          //   link: "/blog"
          // },
          // // Разделитель
          // {
          //   isSeparate: true
          // },
          // // Форум
          // {
          //   text: "Форум",
          //   link: "/forum"
          // }
        ]
      },
      // Язык
      {
        id: "current-language",
        sort: 1500,
        neverActive: true,
        isSvgIcon: true,
        children: [
          // Русский язык
          {
            id: "change-language",
            icon: "language-ru",
            isSvgIcon: true,
            text: "Русский",
            linkParams: {
              language: Language.ru
            }
          },
          // Английский язык
          {
            id: "change-language",
            icon: "language-en",
            isSvgIcon: true,
            text: "English",
            linkParams: {
              language: Language.en
            }
          }
        ]
      }
    ],
    // Авторизованных
    auth: [
      // Личный кабинет
      {
        sort: 0,
        text: "menus.nav_menu.items.profile",
        link: "/profile/:currentUserID",
        children: [
          // Настройки аккаунта
          {
            text: "menus.nav_menu.items.profile_settings",
            link: "/profile/settings",
          },
          // Разделитель
          Separator,
          // Персональные данные
          {
            text: "menus.nav_menu.items.profile_info",
            link: "/profile/settings/person",
          },
          // Персональные данные
          {
            text: "menus.nav_menu.items.profile_notifications",
            link: "/profile/settings/notifications",
          },
          // Приватность
          {
            text: "menus.nav_menu.items.profile_private",
            link: "/profile/settings/private",
          },
          // Настройки внешнего вида
          {
            text: "menus.nav_menu.items.profile_appearance",
            link: "/profile/settings/appearance",
          },
          // Настройки безопасности
          {
            text: "menus.nav_menu.items.profile_security",
            link: "/profile/settings/security",
          },
          // Разделитель
          Separator,
          // Выход
          {
            id: "quit",
            text: "menus.nav_menu.items.profile_log_out"
          }
        ]
      },
      // Дневник
      {
        sort: 50,
        text: "menus.nav_menu.items.my_diary",
        link: "/diary/:currentUserID"
      },
      // Уведомления
      {
        id: "notifications",
        sort: 100,
        icon: "notifications"
      }
    ],
    // Неавторизованных
    notAuth: [
      // Главная
      {
        text: "menus.nav_menu.items.home",
        link: "/home"
      },
      // Личный кабинет
      {
        sort: 1000,
        text: "menus.nav_menu.items.log_in",
        link: "/auth",
        testAttr: "main-menu-item-list-auth",
        children: [
          // Вход
          {
            text: "menus.nav_menu.items.log_in",
            link: "/auth"
          },
          // Регистрация
          {
            text: "menus.nav_menu.items.sign_up",
            testAttr: "main-menu-item-register",
            link: "/register"
          }
        ]
      }
    ]
  },
  // Для телефонов
  mobile: {
    // Для всех пользователей
    any: [
      // Поиск
      {
        sort: 3,
        text: "menus.nav_menu.items.search",
        mobileView: {
          leftPanel: true,
          bottomPanel: true
        },
        children: [
          // Общий поиск
          {
            icon: "search",
            text: "menus.nav_menu.items.search",
            link: "/search",
            mobileView: {
              leftPanel: false,
              bottomPanel: true
            }
          },
          // Люди
          {
            icon: "group",
            text: "menus.nav_menu.items.search_people",
            link: "/people",
            mobileView: {
              leftPanel: true,
              bottomPanel: false
            }
          },
          // Дневники
          {
            icon: "collections_bookmark",
            text: "menus.nav_menu.items.search_dreams",
            link: "/diary/all",
            mobileView: {
              leftPanel: true,
              bottomPanel: false
            }
          },
          // // Блог
          // {
          //   icon: "edit_note",
          //   text: "Блог",
          //   link: "/blog"
          // },
          // // Форум
          // {
          //   icon: "forum",
          //   text: "Форум",
          //   link: "/forum"
          // }
        ]
      }
    ],
    // Авторизованных
    auth: [
      // Личный кабинет
      {
        sort: 1,
        id: "my-profie",
        icon: "person",
        text: "menus.nav_menu.items.profile",
        link: "/profile/:currentUserID",
        mobileView: {
          leftPanel: true,
          bottomPanel: true
        }
      },
      // Дневник
      {
        sort: 2,
        icon: "book",
        text: "menus.nav_menu.items.my_diary",
        link: "/diary/:currentUserID",
        mobileView: {
          leftPanel: true,
          bottomPanel: true
        }
      },
      // Настройки
      {
        sort: 500,
        text: "menus.nav_menu.items.profile_settings",
        mobileView: {
          leftPanel: true,
          bottomPanel: false
        },
        children: [
          // Настройки
          {
            icon: "settings",
            text: "menus.nav_menu.items.profile_settings",
            link: "/profile/settings",
            mobileView: {
              leftPanel: true,
              bottomPanel: false
            }
          },
          // Выход
          {
            id: "quit",
            icon: "exit_to_app",
            text: "menus.nav_menu.items.profile_log_out",
            mobileView: {
              leftPanel: true,
              bottomPanel: false
            }
          }
        ]
      },
      // Уведомления
      {
        sort: 4,
        id: "notifications",
        icon: "notifications",
        mobileView: {
          leftPanel: false,
          bottomPanel: true
        }
      }
    ],
    // Неавторизованных
    notAuth: [
      // Главная
      {
        icon: "home",
        text: "menus.nav_menu.items.home",
        link: "/home",
        mobileView: {
          leftPanel: true,
          bottomPanel: false
        }
      },
      // Личный кабинет
      {
        sort: 1000,
        mobileView: {
          leftPanel: true,
          bottomPanel: true
        },
        children: [
          // Вход
          {
            icon: "key",
            text: "menus.nav_menu.items.log_in",
            link: "/auth",
            mobileView: {
              leftPanel: true,
              bottomPanel: true
            }
          },
          // Регистрация
          {
            icon: "person_add",
            text: "menus.nav_menu.items.sign_up",
            link: "/register",
            mobileView: {
              leftPanel: true,
              bottomPanel: true
            }
          }
        ]
      }
    ]
  }
};
