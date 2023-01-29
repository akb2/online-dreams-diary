import { Injectable } from "@angular/core";
import { ApiResponseMessages } from "@_datas/api";
import { ApiResponse, ApiResponseCodes } from "@_models/api";
import { SnackbarService } from "@_services/snackbar.service";
import { Observable, of, throwError } from "rxjs";





@Injectable({
  providedIn: "root"
})

export class ApiService {


  constructor(
    private snackbarService: SnackbarService
  ) { }





  // Регистрация
  getMessageByCode(code: ApiResponseCodes): string {
    if (!!code && !!ApiResponseMessages[code]) {
      return ApiResponseMessages[code];
    }
    // Нет текста ошибки
    return "Неизвестная ошибка. Повторите позже";
  }


  // Функция для переключения ошибок
  checkSwitchMap(result: ApiResponse, codes: string[] = []): Observable<ApiResponse> {
    const code: ApiResponseCodes = result.result.code;
    // Сохранить токен
    if (code === "0001") {
      return of(result);
    }
    // Вернуть данные
    return this.checkResponse(code, codes);
  }

  // Функция обработки ошибок
  checkResponse(mixedCode: ApiResponseCodes, codes: string[] = []): Observable<any> {
    const code: string = mixedCode.toString();
    // Обработать ошибку внутри подписчика
    if (code === "0001" || codes.includes(code)) {
      return of(code);
    }
    // Ошибка
    else {
      const message: string = "Ошибка " + code + ": " + this.getMessageByCode(code);
      // Сообщение с ошибкой
      if (code !== "XXXX") {
        this.snackbarService.open({ message, mode: "error" });
      }
      // Вернуть ошибку
      return throwError({ message, code });
    }
  }
}
