import { SimpleObject } from "@_models/app";

// Интерфейс ответа сервера
export interface ApiResponse {
  errors: boolean;
  controller: string;
  method: string;
  queryParams: {
    //delete: { [key: string]: string };
    post: SimpleObject;
    get: SimpleObject;
    //put: { [key: string]: string };
  };
  result: {
    code?: ApiResponseCodes;
    message?: string;
    data?: any;
  }
}

// Коды ответа
export type ApiResponseCodes =
  "0001" |
  "0002" |
  "9001"
  ;

// Сообщения об ошибках
export const ApiResponseMessages: SimpleObject = {
  "0001": "Успешное выполнение запроса",
  "0002": "Данные не найдены",

  "9001": "Метод API не найден",
  "9010": "Ошибка капчи",
  "9011": "Логин занят",
  "9012": "Email занят",
  "9013": "Пользователь не найден",
  "9014": "Ошибка создания токена",
  "9020": "Ошибка подключения к БД",
  "9021": "Ошибка запроса к БД",
  "9030": "Ошибка входных данных"
};