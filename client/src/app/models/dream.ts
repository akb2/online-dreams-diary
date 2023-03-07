import { User } from "@_models/account";
import { BaseSearch, Search } from "@_models/api";
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
  type: DreamType;
  mood: DreamMood;
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
  type: DreamType;
  mood: DreamMood;
  keywords: string[];
  places: Place[];
  members: number[];
  text: string;
  map: DreamMap;
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

// Интерфейс ответа поиска сновидений
export interface SearchRequestDream extends Search<Dream> {
  hasAccess: boolean;
}

// Поиск: входящие данные
export interface SearchDream extends BaseSearch {
  q: string;
  user: number;
  status: -1 | DreamStatus;
  type: -1 | DreamType;
  mood: -1 | DreamMood;
  withMap: boolean;
  withText: boolean;
  limit: number;
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

// Тип сновидения
export enum DreamType {
  Simple,
  Chatter,
  Drivel,
  Epic,
  Lucid
}

// Настроение сновидения
export enum DreamMood {
  Philosophy,
  Joy,
  Nothing,
  Sad,
  Gloomy,
  Nightmare
}
