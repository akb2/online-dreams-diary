import { LocalStorageItemInterface } from "@_models/app";
import { Injectable } from "@angular/core";





@Injectable({
  providedIn: "root"
})

export class LocalStorageService {


  private systemItemKey: string = "Online_Dreams_Diary_Cookie_key_";
  itemKey: string = "";
  itemLifeTime: number = 30 * 60;





  // Записать данные в куки
  setItem(key: string, value: any, ttl?: number): void {
    ttl = ttl ? ttl : this.itemLifeTime;

    const now: number = (new Date()).getTime();
    const item: LocalStorageItemInterface = {
      value,
      expiry: now + (ttl * 1000),
    };

    localStorage.setItem(this.systemItemKey + this.itemKey + key, JSON.stringify(item))
  }

  // Получить данные из куки
  getItem<T>(key: string, typeCallback: (d: any) => T = d => d as T): T {
    const itemStr: string = localStorage.getItem(this.systemItemKey + this.itemKey + key) as string;
    const now: number = (new Date()).getTime();
    // Если есть запись
    if (itemStr) {
      try {
        const item: LocalStorageItemInterface = JSON.parse(itemStr) as LocalStorageItemInterface;
        // Вернуть данные
        if (now <= item.expiry) {
          try {
            return typeCallback(JSON.parse(item.value));
          }
          catch (e: any) {
            return typeCallback(item.value);
          }
        }
        // Очистить куки
        else {
          this.deleteItem(key);
        }
      }
      catch (e) {
        this.deleteItem(key);
      }
    }
    // Пустой ответ
    return typeCallback("");
  }

  // Удалить куки
  deleteItem(key: string): void {
    localStorage.removeItem(this.systemItemKey + this.itemKey + key);
  }
}
