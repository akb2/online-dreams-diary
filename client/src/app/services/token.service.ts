import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { environment } from '@_environments/environment';
import { User } from "@_models/account";
import { ApiResponse } from "@_models/api";
import { CustomObject, SimpleObject } from "@_models/app";
import { TokenInfo } from "@_models/token";
import { ApiService } from "@_services/api.service";
import { LocalStorageService } from "@_services/local-storage.service";
import { BehaviorSubject, Observable, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";





@Injectable({
  providedIn: "root"
})
export class TokenService {


  private baseUrl: string = environment.baseUrl;
  private httpHeader: SimpleObject = environment.httpHeader;

  private cookieKey: string = "token_service_";
  private cookieLifeTime: number = 604800;
  public token: string = "";
  public id: string = "";

  private user: BehaviorSubject<User> = new BehaviorSubject<User>(null);
  public readonly user$: Observable<User> = this.user.asObservable();

  // Конструктор
  constructor(
    private httpClient: HttpClient,
    private apiService: ApiService,
    private router: Router,
    private localStorageService: LocalStorageService
  ) {
    this.configLocalStorage();
    this.token = this.localStorageService.getCookie("token");
    this.id = this.localStorageService.getCookie("id");
  }

  // Проверить авторизацию
  public get checkAuth(): boolean {
    return !!this.token && !!this.id;
  }

  // Инициализация Local Storage
  private configLocalStorage(): void {
    this.localStorageService.cookieKey = this.cookieKey;
    this.localStorageService.cookieLifeTime = this.cookieLifeTime;
  }





  // Проверить токен
  public checkToken(codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    formData.append("token", this.token);
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(this.baseUrl + "token/checkToken", formData, this.httpHeader).pipe(switchMap(
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
        // Вернуть данные
        return this.apiService.checkResponse(result.result.code, codes);
      }
    ));
  }

  // Информация о текущем токене
  public getToken(token: string = this.token, codes: string[] = []): Observable<TokenInfo> {
    return this.httpClient.get<ApiResponse>(this.baseUrl + "token/getToken?token=" + token, this.httpHeader).pipe(switchMap(
      result => {
        const code: string = result.result.code;
        // Сохранить токен
        if (code === "0001") {
          return of(result);
        }
        // Вернуть данные
        return this.apiService.checkResponse(result.result.code, codes);
      }
    ), map(result => {
      const tokenData: CustomObject<string | number> = result.result.data.tokenData;
      return {
        id: tokenData.id as number,
        token: tokenData.token as string,
        createDate: new Date(tokenData.create_date),
        lastActionDate: new Date(tokenData.last_action_date),
        userId: tokenData.user_id as number,
        ip: tokenData.ip as string,
        browser: {
          os: tokenData.os as string,
          name: tokenData.browser as string,
          version: parseInt(tokenData.browser_version as string) > 0 ? tokenData.browser_version as string : ""
        }
      };
    }));
  }





  // Запомнить авторизацию
  public saveAuth(token: string, id: string): void {
    this.id = id;
    this.token = token;
    this.configLocalStorage();
    this.localStorageService.setCookie("token", this.token);
    this.localStorageService.setCookie("id", this.id);
  }

  // Сбросить авторизацию
  public deleteAuth(): void {
    this.httpClient.delete<ApiResponse>(this.baseUrl + "token/deleteToken?token=" + this.token).pipe(switchMap(
      result => {
        this.deleteCurrentUser();
        return this.apiService.checkResponse(result.result.code);
      }
    )).subscribe(code => {
      this.token = "";
      this.configLocalStorage();
      this.localStorageService.deleteCookie("token");
      this.router.navigate([""]);
    });
  }

  // Удалить сведения о текущем пользователе
  private deleteCurrentUser(): void {
    this.localStorageService.deleteCookie("current_user");
  }
}
