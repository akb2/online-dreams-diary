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
}

// Интерфейс массива аватарок
interface UserAvatars {
  full: string;
  crop: string;
  middle: string;
  small: string;
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