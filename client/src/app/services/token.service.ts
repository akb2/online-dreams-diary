import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { AppComponent } from "@app/app.component";
import { environment } from '@_environments/environment';
import { User } from "@_models/account";
import { ApiResponse } from "@_models/api";
import { CustomObject, SimpleObject } from "@_models/app";
import { TokenInfo } from "@_models/token";
import { ApiService } from "@_services/api.service";
import { LocalStorageService } from "@_services/local-storage.service";
import { BehaviorSubject, Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";





@Injectable({
  providedIn: "root"
})

export class TokenService {


  private baseUrl: string = environment.baseUrl;
  private httpHeader: SimpleObject = environment.httpHeader;

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

  // Сформировать параметры URL
  getHttpHeader(params: any = null, paramsPreffix: string = ""): CustomObject<any> {
    return {
      ...this.httpHeader,
      params: new HttpParams({
        fromObject: {
          ...(!!params ? Object.entries(params)
            .map(([k, v]) => ([k, Array.isArray(v) ? v.join(",") : v]))
            .reduce((o, [k, v]) => ({ ...o, [paramsPreffix + k]: v }), {}) : {}),
          user_id: this.id,
          token: this.token
        }
      })
    };
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
  getToken(token: string = this.token, codes: string[] = []): Observable<TokenInfo> {
    return this.httpClient.get<ApiResponse>(this.baseUrl + "token/getToken?token=" + token, this.httpHeader).pipe(
      switchMap(result => this.apiService.checkSwitchMap(result, codes)),
      map(result => this.convertToken(result.result.data.tokenData))
    );
  }

  // Информация о всех токенах
  getTokens(hideCurrent: boolean = false, id: string = this.id, codes: string[] = []): Observable<TokenInfo[]> {
    const url: string = this.baseUrl + "token/getTokens?token=" + this.token + "&id=" + id + "&hideCurrent=" + (hideCurrent ? 1 : 0);
    // Вернуть подписку
    return this.httpClient.get<ApiResponse>(url, this.httpHeader).pipe(
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
    const url: string = this.baseUrl + "token/deleteTokenById?token=" + this.token + "&id=" + this.id + "&tokenId=" + id;
    // Вернуть подписку
    return this.httpClient.delete<ApiResponse>(url, this.httpHeader).pipe(
      switchMap(result => this.apiService.checkSwitchMap(result, codes)),
      map(result => result.result.code === "0001")
    );
  }

  // Удалить все токены по ID пользователя
  deleteTokensByUser(hideCurrent: boolean = false, codes: string[] = []): Observable<boolean> {
    const url: string = this.baseUrl + "token/deleteTokensByUser?token=" + this.token + "&id=" + this.id + "&hideCurrent=" + (hideCurrent ? 1 : 0);
    // Вернуть подписку
    return this.httpClient.delete<ApiResponse>(url, this.httpHeader).pipe(
      switchMap(result => this.apiService.checkSwitchMap(result, codes)),
      map(result => result.result.code === "0001")
    );
  }

  // Сбросить авторизацию
  deleteAuth(): void {
    this.httpClient.delete<ApiResponse>(this.baseUrl + "token/deleteToken?token=" + this.token).pipe(switchMap(
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
