import { OptionData } from "@_models/form";
import { PrivateType, UserPrivate, UserPrivateItem, UserPrivateNameItem } from "@_models/account";
import { SimpleObject } from "@_models/app";





// Период статуса онлайн для последней активности
export const OnlinePeriod: number = 60 * 5;

// Склонение слова: человек
export const PeoplePlural: SimpleObject = {
  "=0": "",
  "=1": "# человек",
  "few": "# человека",
  "other": "# человек"
};

// Массив названий настроек приватности
export const UserPrivateNames: UserPrivateNameItem[] = [
  // Моя страница
  {
    rule: "myPage",
    icon: "contacts",
    name: "Моя страница",
    desc: "Кто может видеть информацию на вашей странице"
  },
  // Страница моих сновидений
  {
    rule: "myDreamList",
    icon: "collections_bookmark",
    name: "Мой дневник снов",
    desc: "Кто может просматривать ваш список сновидений (это не влияет на публичные сновидения в общем дневнике)"
  }
];

// Названия состояния права доступа
export const PrivateTypes: OptionData[] = [
  // Только я
  {
    key: PrivateType.private.toString(),
    title: "Только я",
    icon: "person",
    iconColor: "warn"
  },
  // Только друзья
  {
    key: PrivateType.friends.toString(),
    title: "Только друзья",
    icon: "group",
    iconColor: "accent"
  },
  // Только пользователи
  {
    key: PrivateType.users.toString(),
    title: "Только пользователи сайта",
    icon: "groups",
    iconColor: "accent"
  },
  // Все
  {
    key: PrivateType.public.toString(),
    title: "Весь интернет",
    icon: "public",
    iconColor: "primary"
  }
];

// Правило приватности по умолчанию
export const DefaultUserPrivItem: UserPrivateItem = {
  type: PrivateType.public,
  blackList: [],
  whiteList: []
};

// Список правил приватности по умолчанию
export const DefaultUserPriv: UserPrivate = {
  myPage: DefaultUserPrivItem,
  myDreamList: DefaultUserPrivItem
};
