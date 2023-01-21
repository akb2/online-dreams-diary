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
          // Разделитель
          {
            isSeparate: true
          },
          // Блог
          {
            text: "Блог",
            link: "/blog"
          },
          // Разделитель
          {
            isSeparate: true
          },
          // Форум
          {
            text: "Форум",
            link: "/forum"
          }
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
      }
    ]
  },
  // Для телефонов
  mobile: {
    // Для всех пользователей
    any: [
      // Поиск
      {
        sort: 100,
        text: "Поиск",
        children: [
          // Люди
          {
            icon: "group",
            text: "Люди",
            link: "/people"
          },
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
    ],
    // Авторизованных
    auth: [
      // Личный кабинет
      {
        icon: "person",
        text: "Моя страница",
        link: "/profile/:currentUserID"
      },
      // Дневник
      {
        sort: 1,
        icon: "book",
        text: "Мой дневник",
        link: "/diary/:currentUserID"
      },
      // Настройки
      {
        sort: 500,
        text: "Настройки",
        children: [
          // Настройки
          {
            icon: "settings",
            text: "Настройки",
            link: "/profile/settings",
          },
          // Выход
          {
            id: "quit",
            icon: "exit_to_app",
            text: "Выход"
          }
        ]
      }
    ],
    // Неавторизованных
    notAuth: [
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
      }
    ]
  }
};
