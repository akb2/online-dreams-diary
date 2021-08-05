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
import { User } from "oidc-client";





@Injectable({
  providedIn: "root"
})
export class AccountService {


  private baseUrl: string = environment.baseUrl;
  private httpHeader: { [key: string]: string } = environment.httpHeader;

  private cookieKey: string = "account_service_";
  private cookieLifeTime: number = 604800;
  public token: string = "";
  public id: string = "";

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
    this.id = this.localStorageService.getCookie("id");
  }

  // Проверить авторизацию
  public get checkAuth(): boolean {
    return !!this.token && !!this.id;
  }





  // Проверить токен
  public checkToken(codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    formData.append("token", this.token);
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(this.baseUrl + "account/checkToken", formData, this.httpHeader).pipe(switchMap(
      result => {
        const code: string = result.result.code;
        // Сохранить токен
        if (code === "0001") {
          if (this.id === result.result.data.tokenData.user_id) {
            this.saveAuth(result.result.data.tokenData.token, result.result.data.tokenData.user_id);
          }
          // Неверный токен
          else {
            this.deleteCurrentUser();
            this.router.navigate([""]);
          }
        }
        return this.apiService.checkResponse(result.result.code, codes);
      }
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
        this.saveAuth(result.result.data.token, result.result.data.id);
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

  // Информация о текущем пользователе
  public syncCurrentUser(codes: string[] = []): Observable<string> {
    return this.getUser(this.id, codes);
  }

  // Информация о пользователе
  public getUser(id: string, codes: string[] = []): Observable<string> {
    // Вернуть подписку
    return this.httpClient.get<ApiResponse>(this.baseUrl + "account/getUser?id=" + id, this.httpHeader).pipe(switchMap(
      result => {
        if (result.result.code === "0001") {
          this.saveCurrentUser(result.result.data.user as User);
        }
        // Вернуть обработку кодов
        return this.apiService.checkResponse(result.result.code, codes);
      }
    ));
  }





  // Запомнить авторизацию
  private saveAuth(token: string, id: string): void {
    this.id = id;
    this.token = token;
    this.localStorageService.setCookie("token", this.token);
    this.localStorageService.setCookie("id", this.id);
  }

  // Сбросить авторизацию
  public deleteAuth(): void {
    this.httpClient.delete<ApiResponse>(this.baseUrl + "account/deleteToken?token=" + this.token).pipe(switchMap(
      result => {
        this.deleteCurrentUser();
        return this.apiService.checkResponse(result.result.code);
      }
    )).subscribe(code => {
      this.token = "";
      this.localStorageService.deleteCookie("token");
      this.router.navigate([""]);
    });
  }

  // Сведения о текущем пользователе
  public getCurrentUser(): User {
    if (this.checkAuth) {
      const userString: string = this.localStorageService.getCookie("current_user");
      return JSON.parse(userString) as User;
    }
    // Пользователь не найден
    return null;
  }

  // Сведения о текущем пользователе
  private saveCurrentUser(user: User): void {
    if (this.checkAuth) {
      this.localStorageService.setCookie("current_user", JSON.stringify(user));
    }
  }

  // Удалить сведения о текущем пользователе
  private deleteCurrentUser(): void {
    this.localStorageService.deleteCookie("current_user");
  }
}
