import { BaseSearch, BaseSearchSortField, BaseSearchSortType } from "@_models/api";
import { BackgroundImageData } from "@_models/appearance";
import { NavMenuType } from "@_models/nav-menu";
import { CustomObjectKey } from "./app";
import { NotificationActionType } from "./notification";





// Интерфейс данных о пользователе
export interface User extends UserSave {
  id: number;
  online: boolean;
  pageStatus: string;
  settings: UserSettings;
  private: UserPrivate;
  registerDate: Date;
  lastActionDate: Date;
  lastEditDate: Date;
  roles: UserRoles[];
  avatars: UserAvatars;
  avatarCropData: UserAvatarCropData;
}

// Интерфейс настроек пользователя
export interface UserSettings {
  profileBackground: BackgroundImageData;
  profileHeaderType: NavMenuType;
  notifications: CustomObjectKey<NotificationActionType, UserNotificationSetting>;
}

// Интерфейс настроек пользователя для API
export interface UserSettingsDto {
  profileBackground: number;
  profileHeaderType: string;
  notifications: CustomObjectKey<NotificationActionType, UserNotificationSetting>;
}

// настройки уведомлений пользователя
export interface UserNotificationSetting {
  site: boolean;
  email: boolean;
}

// Интерфейс настроек приватности
export interface UserPrivate {
  myPage: UserPrivateItem;
  myDreamList: UserPrivateItem;
  myCommentsWrite: UserPrivateItem;
  myCommentsRead: UserPrivateItem;
}

// Интерфейс элемента настроек приватности
export interface UserPrivateItem {
  type: PrivateType;
  blackList: number[];
  whiteList: number[];
}

// Интерфейс описание настройки приватности
export interface UserPrivateNameItem {
  rule: keyof UserPrivate;
  icon: string;
  name: string;
  desc: string;
  availValues?: PrivateType[];
}

// Интерфейс массива аватарок
interface UserAvatars {
  full: string;
  crop: string;
  middle: string;
  small: string;
}

// Интерфейс массива аватарок
interface UserAvatarCropData {
  crop: UserAvatarCropDataElement;
  middle: UserAvatarCropDataElement;
}

// Интерфейс позиций обрезки аватара
export interface UserAvatarCropDataElement {
  startX: number;
  width: number;
  startY: number;
  height: number;
}

// Интерфейс данных для регистрации
export interface UserRegister extends UserBase {
  login: string;
  password: string;
  captcha: string;
  checkCaptcha: boolean;
}

// Интерфейс данных для обновления аккаунта
export interface UserSave extends UserBase {
  patronymic: string;
}

// Базовые параметры о пользователе
interface UserBase {
  name: string;
  lastName: string;
  birthDate: string;
  sex: UserSex;
  email: string;
  hasAccess?: boolean;
}

// Интерфейс авторизации
export interface AuthResponce {
  code: string;
  activateIsAvail: boolean;
}

// Поиск: входящие данные
export interface SearchUser extends BaseSearch {
  q: string;
  sex: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  sortField: SearchUserSortField;
  sortType: BaseSearchSortType;
}

// Поиск: поля сортировки
export type SearchUserSortField = BaseSearchSortField;





// Перечисление прав доступа
export enum UserRoles {
  admin = "admin"
}

// Перечисление типа приватности
export enum PrivateType {
  private,
  friends,
  users,
  public,
}





// Типы аватарок для обрезки
export type UserAvatarCropDataKeys = "crop" | "middle";

// Перечисления пола пользователей
export enum UserSex {
  Male,
  Female,
  UnDetected
};
