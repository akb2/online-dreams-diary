import { Injectable } from "@angular/core";
import { ApiResponse, ApiResponseMessages } from "@_models/api";
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
  public getMessageByCode(code: string): string {
    if (code) {
      if (ApiResponseMessages[code]) {
        return ApiResponseMessages[code];
      }
    }
    // Нет текста ошибки
    return "Неизвестная ошибка. Повторите позже";
  }


  // Функция для переключения ошибок
  public checkSwitchMap(result: ApiResponse, codes: string[] = []): Observable<ApiResponse> {
    const code: string = result.result.code;
    // Сохранить токен
    if (code === "0001") {
      return of(result);
    }
    // Вернуть данные
    return this.checkResponse(result.result.code, codes);
  }

  // Функция обработки ошибок
  public checkResponse(code: string, codes: string[] = []): Observable<any> {
    // Обработать ошибку внутри подписчика
    if (code === "0001" || codes.some(testCode => testCode === code)) {
      return of(code);
    }
    // Ошибка
    else {
      const message: string = "Ошибка " + code + ": " + this.getMessageByCode(code);
      // Сообщение с ошибкой
      this.snackbarService.open({
        message: message,
        mode: "error"
      });
      // Вернуть ошибку
      return throwError(message);
    }
  }
}
