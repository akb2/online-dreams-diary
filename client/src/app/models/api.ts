import { ApiResponseMessages } from "@_datas/api";
import { CustomObject, SimpleObject } from "@_models/app";





// Коды ответа
export type ApiResponseCodes = keyof typeof ApiResponseMessages;

// Тип объекта для URL параметров
export type UrlObject = CustomObject<string | number | boolean>;

// Тип объекта для значений URL параметров для исключения
export type ExcludeUrlObjectParams = (string | number | boolean)[];
export type ExcludeUrlObjectValues = CustomObject<ExcludeUrlObjectParams | boolean>;

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

// Базовый интерфейс поиска
export interface BaseSearch {
  page: number;
  limit: number;
  ids: number[];
  excludeIds: number[];
}

// Базовые типы полей сортирвки
export type BaseSearchSortField = "id";

// Поиск: направления сортировки
export type BaseSearchSortType = "asc" | "desc";
