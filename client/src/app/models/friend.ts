import { User } from "@_models/account";
import { BaseSearch } from "@_models/api";





// Интерфейс заявки в друзья
export interface Friend {
  id: number;
  outUserId: number;
  inUserId: number;
  status: FriendStatus;
  outDate: Date;
  inDate: Date;
}

// Интерфейс заявки в друзья с данными о пользователе
export interface FriendWithUsers extends Friend {
  inUser: User;
  outUser: User;
}

// Модель для поиска друзей
export interface FriendSearch extends BaseSearch {
  type: FriendSearchType;
}





// Тип заявок в друзья для поиска
export type FriendSearchType = "friends" | "subscribers" | "subscribe";





// Состояние заявки в друзья
export enum FriendStatus {
  NotAutorized = -2,
  NotExists = -1,
  Friends = 1,
  OutSubscribe = 0,
  InSubscribe = 2,
}
