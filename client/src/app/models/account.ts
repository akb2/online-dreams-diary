import { BackgroundImageData } from "@_models/appearance";
import { NavMenuType } from "@_models/nav-menu";





// Интерфейс данных о пользователе
export interface User {
  id: number;
  pageStatus: string;
  settings: UserSettings;
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

export interface UserSettingsDto {
  profileBackground: number;
  profileHeaderType: string;
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





// Типы аватарок для обрезки
export type UserAvatarCropDataKeys = "crop" | "middle";

// Типы пола пользователей
export enum UserSex {
  Male,
  Female
};
