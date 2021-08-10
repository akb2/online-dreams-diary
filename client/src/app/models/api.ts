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

  "8010": "Ошибка удаления файлов аватарок",

  "9001": "Метод API не найден",
  "9010": "Ошибка капчи",
  "9011": "Логин занят",
  "9012": "Email занят",
  "9013": "Пользователь не найден",
  "9014": "Ошибка создания или обновления токена",
  "9015": "Неверный токен авторизации, авторизуйтесь заново",
  "9016": "Ваш токен просрочен, авторизуйтесь заново",
  "9017": "Ошибка удаления токена",
  "9020": "Ошибка подключения к БД",
  "9021": "Ошибка запроса к БД",
  "9030": "Ошибка входных данных",
  "9040": "У вас нет доступа к данной операции",
  "9999": "Неизвестная ошибка. Повторите позже"
};