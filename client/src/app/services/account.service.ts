import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { UserRegister } from "@_models/account";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from '@_environments/environment';
import { ApiResponse, ApiResponseMessages } from "@_models/api";





@Injectable({
  providedIn: "root"
})





export class AccountService {


  private baseUrl: string = environment.baseUrl;
  private httpHeader: { [key: string]: string } = environment.httpHeader;
  private authTryCount: number = 0;

  // Конструктор
  constructor(
    private httpClient: HttpClient
  ) { }





  // Авторизация
  public auth(login: string, password: string): Observable<string> {
    const formData: FormData = new FormData();
    formData.append("login", login);
    formData.append("password", password);
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(this.baseUrl + "account/auth", formData, this.httpHeader).pipe(map(result => {
      console.log(result);
      return result.result.code;
    }));
  }

  // Регистрация
  public register(data: UserRegister): Observable<string> {
    const formData: FormData = new FormData();
    Object.entries(data).map(value => formData.append(value[0], value[1]));
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(this.baseUrl + "account/register", formData, this.httpHeader).pipe(map(result => result.result.code));
  }
}
