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