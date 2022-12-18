import { OptionData } from "@_controlers/autocomplete-input/autocomplete-input.component";
import { PrivateType, UserPrivateNameItem } from "@_models/account";
import { SimpleObject } from "@_models/app";





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
