import { OptionData } from "@_controlers/autocomplete-input/autocomplete-input.component";
import { User } from "@_models/account";
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
  draft, // Черновик
  private, // Доступен только автору
  hash, // Доступен по специальной ссылке
  friends, // Доступен только друзьям
  users, // Доступен только авторизованным пользователям
  public, // Доступен всем в интернете
}





// Набор методов для типа сновидения
export const DreamModes: OptionData[] = [{
  key: DreamMode.text.toString(),
  title: "В виде текста",
  icon: "notes",
  iconColor: "primary",
  iconBackground: "fill"
}, {
  key: DreamMode.map.toString(),
  title: "В виде карты",
  icon: "explore",
  iconColor: "primary",
  iconBackground: "fill"
}, {
  key: DreamMode.mixed.toString(),
  title: "В виде карты и описания",
  icon: "library_books",
  iconColor: "primary",
  iconBackground: "fill"
}];