import { ApiResponseMessages } from "@_datas/api";
import { SimpleObject } from "@_models/app";





// Коды ответа
export type ApiResponseCodes = keyof typeof ApiResponseMessages;

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
  },
  echo: string;
}

// Поиск: ответ
export interface Search<T> {
  count: number;
  limit: number;
  result: T[];
}
