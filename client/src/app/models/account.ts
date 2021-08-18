// Интерфейс данных о пользователе
export interface User {
  id: number;
  name: string;
  lastName: string;
  patronymic: string;
  birthDate: Date;
  registerDate: Date;
  sex: number;
  email: string;
  roles: string[];
  avatars: UserAvatars;
  avatarCropData: UserAvatarCropData;
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