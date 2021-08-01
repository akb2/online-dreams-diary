import { Injectable } from "@angular/core";
import { ApiResponseMessages } from "@_models/api";
import { SimpleObject } from "@_models/app";





@Injectable({
  providedIn: "root"
})





export class ApiService {
  // Регистрация
  public getMessageByCode(code: string): string {
    if (code) {
      if (ApiResponseMessages[code]) {
        return ApiResponseMessages[code];
      }
    }
    // Нет текста ошибки
    return "";
  }
}
