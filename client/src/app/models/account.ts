import { BackgroundImageData } from "@_models/appearance";





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
  sex: number;
  email: string;
  roles: UserRoles[];
  avatars: UserAvatars;
  avatarCropData: UserAvatarCropData;
}

// Интерфейс настроек пользователя
export interface UserSettings {
  profileBackground: BackgroundImageData;
}

export interface UserSettingsDto {
  profileBackground: number;
}

// Интерфейс массива аватарок
interface UserAvatars {
  full: string;
  crop: string;
  middle: string;
  small: string;
}

// Интерфейс прав доступа
export enum UserRoles {
  admin = "admin"
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

// Типы аватарок для обрезки
export type UserAvatarCropDataKeys = "crop" | "middle";

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