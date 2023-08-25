import { MenuItem, MenuItemsListDevices } from "@_models/menu";





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
        text: "Поиск",
        link: "/search",
        children: [
          // Люди
          {
            text: "Люди",
            link: "/people"
          },
          // Разделитель
          {
            isSeparate: true
          },
          // Дневники
          {
            text: "Дневники снов",
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
      }
    ],
    // Авторизованных
    auth: [
      // Личный кабинет
      {
        sort: 0,
        text: "Моя страница",
        link: "/profile/:currentUserID",
        children: [
          // Настройки аккаунта
          {
            text: "Настройки",
            link: "/profile/settings",
          },
          // Разделитель
          Separator,
          // Персональные данные
          {
            text: "Мои данные",
            link: "/profile/settings/person",
          },
          // Персональные данные
          {
            text: "Уведомления",
            link: "/profile/settings/notifications",
          },
          // Приватность
          {
            text: "Приватность",
            link: "/profile/settings/private",
          },
          // Настройки внешнего вида
          {
            text: "Персонализация",
            link: "/profile/settings/appearance",
          },
          // Настройки безопасности
          {
            text: "Безопасность",
            link: "/profile/settings/security",
          },
          // Разделитель
          Separator,
          // Выход
          {
            id: "quit",
            text: "Выход"
          }
        ]
      },
      // Дневник
      {
        sort: 50,
        text: "Мой дневник",
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
        text: "Главная",
        link: "/home"
      },
      // Личный кабинет
      {
        sort: 1000,
        text: "Вход",
        link: "/auth",
        children: [
          // Вход
          {
            text: "Вход",
            link: "/auth"
          },
          // Регистрация
          {
            text: "Регистрация",
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
        text: "Поиск",
        mobileView: {
          leftPanel: true,
          bottomPanel: true
        },
        children: [
          // Общий поиск
          {
            icon: "search",
            text: "Поиск",
            link: "/search",
            mobileView: {
              leftPanel: false,
              bottomPanel: true
            }
          },
          // Люди
          {
            icon: "group",
            text: "Люди",
            link: "/people",
            mobileView: {
              leftPanel: true,
              bottomPanel: false
            }
          },
          // Дневники
          {
            icon: "collections_bookmark",
            text: "Дневники снов",
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
        text: "Моя страница",
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
        text: "Мой дневник",
        link: "/diary/:currentUserID",
        mobileView: {
          leftPanel: true,
          bottomPanel: true
        }
      },
      // Настройки
      {
        sort: 500,
        text: "Настройки",
        mobileView: {
          leftPanel: true,
          bottomPanel: false
        },
        children: [
          // Настройки
          {
            icon: "settings",
            text: "Настройки",
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
            text: "Выход",
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
        text: "Главная",
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
            text: "Вход",
            link: "/auth",
            mobileView: {
              leftPanel: true,
              bottomPanel: true
            }
          },
          // Регистрация
          {
            icon: "person_add",
            text: "Регистрация",
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
