// Интерфейс данных о пользователе
export interface User {
  name: string;
  lastName: string;
  birthDate: Date;
  registerDate: Date;
  sex: number;
  email: string;
  roles: string[];
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