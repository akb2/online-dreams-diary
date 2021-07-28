import { Injectable } from "@angular/core";





@Injectable({
  providedIn: "root"
})





export class LocalStorage {


  public cookieKey: string = "register_form_data_";
  public cookieLifeTime: number = 30 * 60;





  // Записать данные в куки
  public setCookie(key: string, value: string, ttl?: number): void {
    ttl = ttl ? ttl : this.cookieLifeTime;

    const now: number = (new Date()).getTime();
    const item: CookieInterface = {
      value: value,
      expiry: now + (ttl * 1000),
    };

    localStorage.setItem(this.cookieKey + key, JSON.stringify(item))
  }

  // Получить данные из куки
  public getCookie(key: string): string {
    const itemStr: string = localStorage.getItem(this.cookieKey + key) as string;
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
          localStorage.removeItem(this.cookieKey + key);
        }
      }
      catch (e) {
        localStorage.removeItem(this.cookieKey + key);
      }
    }

    return "";
  }
}





// Данные для Cookie
interface CookieInterface {
  value: string;
  expiry: number;
}