import { Injectable } from "@angular/core";
import { CookieInterface } from "@_models/app";





@Injectable({
  providedIn: "root"
})





export class LocalStorageService {


  private systemCookieKey: string = "Online_Dreams_Diary_Cookie_key_";
  public cookieKey: string = "";
  public cookieLifeTime: number = 30 * 60;





  // Записать данные в куки
  public setCookie(key: string, value: string, ttl?: number): void {
    ttl = ttl ? ttl : this.cookieLifeTime;

    const now: number = (new Date()).getTime();
    const item: CookieInterface = {
      value: value,
      expiry: now + (ttl * 1000),
    };

    localStorage.setItem(this.systemCookieKey + this.cookieKey + key, JSON.stringify(item))
  }

  // Получить данные из куки
  public getCookie(key: string): string {
    const itemStr: string = localStorage.getItem(this.systemCookieKey + this.cookieKey + key) as string;
    const now: number = (new Date()).getTime();

    // Если есть запись
    if (itemStr) {
      try {
        const item: CookieInterface = JSON.parse(itemStr) as CookieInterface;
        // Вернуть данные
        if (now <= item.expiry) {
          return item.value;
        }
        // Очистить куки
        else {
          this.deleteCookie(key);
        }
      }
      catch (e) {
        this.deleteCookie(key);
      }
    }

    return "";
  }

  // Удалить куки
  public deleteCookie(key: string): void {
    localStorage.removeItem(this.systemCookieKey + this.cookieKey + key);
  }
}