import { Injectable } from "@angular/core";
import { ApiResponse, ApiResponseCodes } from "@_models/api";
import { ApiResponseMessages } from "@_datas/api";
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
  checkResponse(code: ApiResponseCodes, codes: string[] = []): Observable<any> {
    // Обработать ошибку внутри подписчика
    if (code === "0001" || codes.some(testCode => testCode === code)) {
      return of(code);
    }
    // Ошибка
    else {
      const message: string = "Ошибка " + code + ": " + this.getMessageByCode(code);
      // Сообщение с ошибкой
      this.snackbarService.open({ message, mode: "error" });
      // Вернуть ошибку
      return throwError(message);
    }
  }
}
