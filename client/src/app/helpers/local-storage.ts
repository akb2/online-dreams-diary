import { LocalStorageItemInterface } from "@_models/app";





// Время жизни по умолчанию
export const LocalStorageDefaultTtl: number = 604800;

// Сохранить данные
export const LocalStorageSet = (key: string, value: any, ttl: number = LocalStorageDefaultTtl): void => {
  const now: number = (new Date()).getTime();
  const expiry: number = !!ttl ? now + (ttl * 1000) : 0;
  // Сохранить
  localStorage.setItem(key, JSON.stringify({ value, expiry }));
};

// Удалить данные
export const LocalStorageRemove = (key: string): void => localStorage.removeItem(key);

// Извлеч данные
export const LocalStorageGet = <T = any>(key: string, typeCallback: (d: any) => T = d => d as T): T => {
  const itemStr: string = localStorage.getItem(key)?.toString();
  const now: number = (new Date()).getTime();
  // Если есть запись
  if (itemStr) {
    try {
      const item: LocalStorageItemInterface = JSON.parse(itemStr) as LocalStorageItemInterface;
      // Вернуть данные
      if (now <= item.expiry || item.expiry <= 0) {
        try {
          return typeCallback(JSON.parse(item.value));
        }
        // Вернуть в виде строки
        catch (e: any) {
          return typeCallback(item.value);
        }
      }
      // Очистить куки
      else {
        LocalStorageRemove(key);
      }
    }
    // Удалить в случае ошибки
    catch (e) {
      LocalStorageRemove(key);
    }
  }
  // Пустой ответ
  return typeCallback("");
};
