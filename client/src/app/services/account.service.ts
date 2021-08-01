import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { UserRegister } from "@_models/account";
import { Observable } from "rxjs";
import { switchMap } from "rxjs/operators";
import { environment } from '@_environments/environment';
import { ApiResponse } from "@_models/api";
import { LocalStorageService } from "@_services/local-storage.service";
import { ApiService } from "@_services/api.service";
import { Router } from "@angular/router";





@Injectable({
  providedIn: "root"
})





export class AccountService {


  private baseUrl: string = environment.baseUrl;
  private httpHeader: { [key: string]: string } = environment.httpHeader;

  private cookieKey: string = "account_service_";
  private cookieLifeTime: number = 36000;
  public token: string = "";

  // Конструктор
  constructor(
    private httpClient: HttpClient,
    private apiService: ApiService,
    private router: Router,
    private localStorageService: LocalStorageService
  ) {
    this.localStorageService.cookieKey = this.cookieKey;
    this.localStorageService.cookieLifeTime = this.cookieLifeTime;
    this.token = this.localStorageService.getCookie("token");
  }

  // Проверить авторизацию
  public get checkAuth(): boolean {
    return !!this.token;
  }





  // Проверить токен
  public checkToken(codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    formData.append("token", this.token);
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(this.baseUrl + "account/checkToken", formData, this.httpHeader).pipe(switchMap(
      result => this.apiService.checkResponse(result.result.code, codes)
    ));
  }

  // Авторизация
  public auth(login: string, password: string, codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    formData.append("login", login);
    formData.append("password", password);
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(this.baseUrl + "account/auth", formData, this.httpHeader).pipe(switchMap(result => {
      const code: string = result.result.code;
      // Сохранить токен
      if (code === "0001") {
        this.saveAuth(result.result.data.token);
        this.router.navigate([""]);
      }
      // Обработка ошибки
      return this.apiService.checkResponse(code, codes);
    }));
  }

  // Регистрация
  public register(data: UserRegister, codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    Object.entries(data).map(value => formData.append(value[0], value[1]));
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(this.baseUrl + "account/register", formData, this.httpHeader).pipe(switchMap(
      result => this.apiService.checkResponse(result.result.code, codes)
    ));
  }





  // Запомнить авторизацию
  public saveAuth(token: string): void {
    this.token = token;
    this.localStorageService.setCookie("token", this.token);
  }

  // Сбросить авторизацию
  public deleteAuth(): void {
    this.httpClient.delete<ApiResponse>(this.baseUrl + "account/deleteToken?token=" + this.token).pipe(switchMap(
      result => this.apiService.checkResponse(result.result.code)
    )).subscribe(code => {
      this.token = "";
      this.localStorageService.deleteCookie("token");
      this.router.navigate([""]);
    });
  }
}
