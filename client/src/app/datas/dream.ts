import { OptionData } from "@_controlers/autocomplete-input/autocomplete-input.component";
import { SimpleObject } from "@_models/app";
import { DreamMode, DreamStatus } from "@_models/dream";





// Набор методов для типа сновидения
export const DreamModes: OptionData[] = [
  // В виде текста
  {
    key: DreamMode.text.toString(),
    title: "В виде текста",
    icon: "notes",
    iconColor: "primary",
    iconBackground: "fill"
  },
  // В виде карты
  {
    key: DreamMode.map.toString(),
    title: "В виде карты",
    icon: "explore",
    iconColor: "primary",
    iconBackground: "fill"
  },
  // В виде карты и описания
  {
    key: DreamMode.mixed.toString(),
    title: "В виде карты и описания",
    icon: "library_books",
    iconColor: "primary",
    iconBackground: "fill"
  }
];

// Набор методов для статуса сновидения
export const DreamStatuses: OptionData[] = [
  // Черновик
  {
    key: DreamStatus.draft.toString(),
    title: "Черновик",
    subTitle: "Доступно только для вас",
    icon: "drive_file_rename_outline",
    iconColor: "disabled",
    iconBackground: "fill"
  },
  // Личное сновидение
  {
    key: DreamStatus.private.toString(),
    title: "Личное сновидение",
    subTitle: "Доступно только для вас",
    icon: "lock",
    iconColor: "warn",
    iconBackground: "fill"
  },
  // Для друзей
  {
    key: DreamStatus.friends.toString(),
    title: "Для друзей",
    subTitle: "Доступно для вас и списка друзей",
    icon: "group",
    iconColor: "accent",
    iconBackground: "fill"
  },
  // Для сообщества
  {
    key: DreamStatus.users.toString(),
    title: "Для сообщества",
    subTitle: "Доступно только пользователям сервиса",
    icon: "vpn_lock",
    iconColor: "accent",
    iconBackground: "fill"
  },
  // По ссылке
  {
    key: DreamStatus.hash.toString(),
    title: "По ссылке",
    subTitle: "Доступно для вас и всех по специальной ссылке",
    icon: "link",
    iconColor: "primary",
    iconBackground: "fill"
  },
  // Публичное сновидение
  {
    key: DreamStatus.public.toString(),
    title: "Публичное сновидение",
    subTitle: "Доступно для всех в интернете",
    icon: "travel_explore",
    iconColor: "primary",
    iconBackground: "fill"
  }
];

// Склонение количества сновидений
export const DreamPlural: SimpleObject = {
  "=0": "",
  "=1": "# сновидение",
  "few": "# сновидения",
  "other": "# сновидений"
};
