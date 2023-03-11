import { HttpParams } from "@angular/common/http";
import { ExcludeUrlObjectParams, ExcludeUrlObjectValues } from "@_models/api";
import { CustomObject, MultiObject, SimpleObject } from "@_models/app";
import { map, Observable, skipWhile, takeWhile, timer } from "rxjs";





// Преобразование объекта в параметры
export const ObjectToParams = (params: CustomObject<any>, keyPreffix: string = "") => {
  const unPreffixKeys: string[] = ["withCredentials"];
  // Вернуть параметры
  return Object.entries(params)
    .map(([k, v]) => ([(unPreffixKeys.includes(k) ? "" : keyPreffix) + k, Array.isArray(v) ? v.join(",") : v]))
    .reduce((o, [k, v]) => o.set(k, v), new HttpParams());
};

// Подготовка объекта как параметры URL
export const ObjectToUrlObject = (params: CustomObject<any>, keyPreffix: string = "", excludeParams: ExcludeUrlObjectValues) => Object.entries(params)
  .map(([k, v]) => ([keyPreffix + k, Array.isArray(v) ? v.join(",") : (v?.toString() ?? null)]))
  .map(([k, v]) => {
    const hasInExclude: boolean = excludeParams.hasOwnProperty(k) && (
      excludeParams[k] === true ||
      (Array.isArray(excludeParams[k]) && (excludeParams[k] as ExcludeUrlObjectParams).map(e => e.toString()).includes(v))
    );
    // Вернуть результат
    return !!k && !!v && !hasInExclude ? [k, v] : [k, null];
  })
  .reduce((o, [k, v]) => ({
    ...o,
    [keyPreffix + k.toString()]: (Array.isArray(v) ? v.join(",") : v?.toString())
  }), {} as SimpleObject);

// Преобразование объекта в параметры в виде строки
export const ObjectToStringParams = (params: CustomObject<any>, keyPreffix: string = "", excludeParams: ExcludeUrlObjectValues) =>
  Object.entries(ObjectToUrlObject(params, keyPreffix, excludeParams))
    .filter(([, v]) => !!v)
    .map(([k, v]) => (keyPreffix + k) + "=" + v)
    .join('&');

// Преобразование объекта в FormControl
export const ObjectToFormData = (params: CustomObject<any> = {}, keyPreffix: string = "") => {
  const formData: FormData = new FormData();
  // Добавить параметры в форму
  Object.entries(params)
    .map(([k, v]) => ([keyPreffix + k, v]))
    .forEach(([k, v]) => formData.append(k, v));
  // Вернуть форму
  return formData;
};

// Преобразование URL параметров из строки в объект
export const UrlParamsStringToObject = (stringParams: string) => {
  const searchParams: URLSearchParams = new URLSearchParams(stringParams);
  const result: MultiObject<string | string[]> = {};
  // Поиск данных
  for (let k of searchParams.keys()) {
    const keyRegExp: RegExp = new RegExp("^([a-z0-9\-_]+)\\[([a-z0-9\-_]+)\\]$", "i");
    // Объекты
    if (keyRegExp.test(k)) {
      const [key, subKey]: string[] = k.replace(keyRegExp, "$1,$2").split(",");
      // Присвоение данных
      result[key] = result[key] ?? {};
      result[key][subKey] = result[key][subKey] ?? searchParams.getAll(k);
      result[key][subKey] = result[key][subKey]?.length > 1 ? result[key][subKey] : result[key][subKey][0];
    }
    // Обычные данные
    else {
      result[k] = searchParams.getAll(k);
      result[k] = result[k]?.length > 1 ? result[k] : result[k][0];
    }
  }
  // Вернуть результат
  return result;
};

// Тип сообщений об ошибках
export const ApiResponseMessages: SimpleObject = {
  "XXXX": "Запрос был заблокирован на уровне приложения",

  "0000": "Пустой ответ сервера, состояние выполнения запроса неизвестно",
  "0001": "Успешное выполнение запроса",
  "0002": "Данные не найдены",
  "0003": "Данные для удаления не найдены",
  "0004": "Некоторые данные могли быть не обработаны",

  "1000": "Получены пустые данные",
  "1001": "Неверный тип запроса",

  "6001": "Не удалось отправить заявку в друзья",
  "6002": "Не удалось отклонить заявку в друзья",
  "6003": "Не удалось подтвердить заявку в друзья",
  "6004": "Не удалось удалить пользователя из друзей",

  "7001": "Сновидение не сохранено",
  "7002": "Это сновидение скрыто от вас настройками приватности",
  "7003": "У вас нет доступа для редактирования данного сновидения",
  "7004": "Неудалось удалить сновидение",
  "7005": "У вас нет доступа для удаления данного сновидения",

  "8010": "Ошибка удаления файлов аватарок",
  "8011": "Ошибка загрузки файла аватарки",
  "8012": "Размер файла превышает допустимый",
  "8013": "Ошибка создания дополнительных аватарок",
  "8014": "Файл аватарки не существует",
  "8015": "Неудалось обрезать аватарку",

  "8100": "Данный раздел скрыт пользователем настройками приватности",
  "8101": "Пользователь скрыл от вас свою страницу настройками приватности",
  "8102": "Пользователь скрыл от вас свой дневник сновидений настройками приватности",

  "9001": "Метод API не найден",
  "9010": "Ошибка капчи",
  "9011": "Логин занят",
  "9012": "Email занят",
  "9013": "Пользователь не найден",
  "9014": "Ошибка создания или обновления токена",
  "9015": "Неверный токен авторизации, авторизуйтесь заново",
  "9016": "Ваш токен просрочен, авторизуйтесь заново",
  "9017": "Ошибка удаления токена",
  "9018": "Не удалось создать код активации пользователя",
  "9019": "Требуется активация аккаунта",
  "9020": "Ошибка подключения к БД",
  "9021": "Ошибка запроса к БД",
  "9022": "Аккаунт уже активирован",
  "9023": "Не удалось активировать аккаунт",
  "9024": "Неверный код активации",
  "9025": "Код активации истек",
  "9026": "Аккаунт уже активирован",
  "9030": "Ошибка входных данных",
  "9040": "У вас нет доступа к данной операции",

  "9999": "Неизвестная ошибка. Повторите позже"
} as const;

// Подписка ожидания условия
export const WaitObservable = (callback: () => boolean, limit: number = Infinity): Observable<void> => timer(0, 50).pipe(
  takeWhile(i => callback() && i < limit, true),
  skipWhile(i => callback() && i < limit),
  map(() => { })
);
