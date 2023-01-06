import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { User } from "@_models/account";
import { ApiResponse, ApiResponseCodes } from "@_models/api";
import { CustomObject } from "@_models/app";
import { TokenInfo } from "@_models/token";
import { ApiService } from "@_services/api.service";
import { LocalStorageService } from "@_services/local-storage.service";
import { BehaviorSubject, Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";





@Injectable({
  providedIn: "root"
})

export class TokenService {


  private cookieKey: string = "token_service_";
  private cookieLifeTime: number = 604800;
  token: string = "";
  id: string = "";

  private user: BehaviorSubject<User> = new BehaviorSubject<User>(null);
  readonly user$: Observable<User> = this.user.asObservable();





  // Проверить авторизацию
  get checkAuth(): boolean {
    return !!this.token && !!this.id;
  }

  // Инициализация Local Storage
  private configLocalStorage(): void {
    this.localStorageService.cookieKey = this.cookieKey;
    this.localStorageService.cookieLifeTime = this.cookieLifeTime;
  }





  constructor(
    private httpClient: HttpClient,
    private apiService: ApiService,
    private router: Router,
    private localStorageService: LocalStorageService
  ) {
    this.updateState();
  }





  // Получить данные из Local Storage
  updateState(): void {
    this.configLocalStorage();
    this.token = this.localStorageService.getCookie("token");
    this.id = this.localStorageService.getCookie("current_user");
  }





  // Проверить токен
  checkToken(codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>("token/checkToken", formData).pipe(switchMap(
      result => {
        const code: ApiResponseCodes = result.result.code;
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
  getToken(codes: string[] = []): Observable<TokenInfo> {
    return this.httpClient.get<ApiResponse>("token/getToken").pipe(
      switchMap(result => this.apiService.checkSwitchMap(result, codes)),
      map(result => this.convertToken(result.result.data.tokenData))
    );
  }

  // Информация о всех токенах
  getTokens(hideCurrent: boolean = false, codes: string[] = []): Observable<TokenInfo[]> {
    const url: string = "token/getTokens?hideCurrent=" + (hideCurrent ? 1 : 0);
    // Вернуть подписку
    return this.httpClient.get<ApiResponse>(url).pipe(
      switchMap(result => this.apiService.checkSwitchMap(result, codes)),
      map(result => {
        const tokensInfo: any[] = result.result?.data?.tokenDatas as any[] || [];
        // Список
        if (tokensInfo.length) {
          return tokensInfo.map(token => this.convertToken(token));
        }
        // Пустой ответ
        return [];
      })
    );
  }

  // Удалить токен по ID
  deleteTokenById(id: number, codes: string[] = []): Observable<boolean> {
    const url: string = "token/deleteTokenById?tokenId=" + id;
    // Вернуть подписку
    return this.httpClient.delete<ApiResponse>(url).pipe(
      switchMap(result => this.apiService.checkSwitchMap(result, codes)),
      map(result => result.result.code === "0001")
    );
  }

  // Удалить все токены по ID пользователя
  deleteTokensByUser(hideCurrent: boolean = false, codes: string[] = []): Observable<boolean> {
    const url: string = "token/deleteTokensByUser?hideCurrent=" + (hideCurrent ? 1 : 0);
    // Вернуть подписку
    return this.httpClient.delete<ApiResponse>(url).pipe(
      switchMap(result => this.apiService.checkSwitchMap(result, codes)),
      map(result => result.result.code === "0001")
    );
  }

  // Сбросить авторизацию
  deleteAuth(): void {
    this.httpClient.delete<ApiResponse>("token/deleteToken").pipe(switchMap(
      result => {
        this.deleteCurrentUser();
        return this.apiService.checkResponse(result.result.code);
      }
    )).subscribe(code => {
      this.id = "";
      this.token = "";
      this.configLocalStorage();
      this.localStorageService.deleteCookie("token");
      this.localStorageService.deleteCookie("current_user");
      this.router.navigate([""]);
    });
  }





  // Преобразование информации о токене
  private convertToken(tokenData: CustomObject<string | number>): TokenInfo {
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
  }

  // Запомнить авторизацию
  saveAuth(token: string, id: string): void {
    this.id = id;
    this.token = token;
    this.configLocalStorage();
    this.localStorageService.setCookie("token", this.token);
    this.localStorageService.setCookie("current_user", this.id);
  }

  // Удалить сведения о текущем пользователе
  private deleteCurrentUser(): void {
    this.localStorageService.deleteCookie("current_user");
  }
}
