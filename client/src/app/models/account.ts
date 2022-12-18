import { BackgroundImageData } from "@_models/appearance";
import { NavMenuType } from "@_models/nav-menu";





// Интерфейс данных о пользователе
export interface User {
  id: number;
  pageStatus: string;
  settings: UserSettings;
  private: UserPrivate;
  name: string;
  lastName: string;
  patronymic: string;
  birthDate: Date;
  registerDate: Date;
  sex: UserSex;
  email: string;
  roles: UserRoles[];
  avatars: UserAvatars;
  avatarCropData: UserAvatarCropData;
}

// Интерфейс настроек пользователя
export interface UserSettings {
  profileBackground: BackgroundImageData;
  profileHeaderType: NavMenuType;
}

// Интерфейс настроек пользователя для API
export interface UserSettingsDto {
  profileBackground: number;
  profileHeaderType: string;
}

// Интерфейс настроек приватности
export interface UserPrivate {
  myPage: UserPrivateItem;
  myDreamList: UserPrivateItem;
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
export interface UserRegister {
  login: string;
  password: string;
  name: string;
  lastName: string;
  birthDate: string;
  sex: number;
  email: string;
  captcha: string;
}

// Интерфейс данных для обновления аккаунта
export interface UserSave {
  name: string;
  lastName: string;
  patronymic: string;
  birthDate: string;
  sex: number;
  email: string;
}





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
  Female
};
