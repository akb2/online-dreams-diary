import { OptionData } from "@_controlers/autocomplete-input/autocomplete-input.component";
import { User } from "@_models/account";
import { SimpleObject } from "@_models/app";
import { BackgroundImageData } from "@_models/appearance";
import { DreamMap } from "@_models/dream-map";
import { NavMenuType } from "@_models/nav-menu";





// Интерфейс сновидения API
export interface DreamDto {
  id: number;
  userId: number;
  createDate: string;
  date: string;
  title: string;
  description: string;
  keywords: string;
  text: string;
  places: string;
  members: string;
  map: string;
  mode: DreamMode;
  status: DreamStatus;
  headerType: NavMenuType;
  headerBackgroundId: number;
}

// Интерфейс сновидения
export interface Dream {
  id: number;
  user: User;
  createDate: Date;
  title: string;
  date: Date;
  description: string;
  mode: DreamMode;
  status: DreamStatus;
  keywords: string[];
  places: Place[] | null;
  members: number[] | null;
  text: string;
  map: DreamMap | null;
  headerType: NavMenuType;
  headerBackground: BackgroundImageData;
}

// Интерфейс локаций
export interface Place {
  id: number;
  userId: number;
  name: string;
  description: string;
  isReal: boolean;
}






// Тип сновидения
export enum DreamMode {
  text,
  map,
  mixed
}

// Статус сновидения
export enum DreamStatus {
  draft, // (0) Черновик
  private, // (1) Доступен только автору
  hash, // (2) Доступен по специальной ссылке
  friends, // (3) Доступен только друзьям
  users, // (4) Доступен только авторизованным пользователям
  public, // (5) Доступен всем в интернете
}





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
