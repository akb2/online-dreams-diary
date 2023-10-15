import { CurrentUserIdLocalStorageKey, CurrentUserIdLocalStorageTtl } from "@_datas/account";
import { ObjectToFormData } from "@_datas/api";
import { BrowserNames, OsNames, ToDate } from "@_datas/app";
import { GetCurrentUserId } from "@_helpers/account";
import { LocalStorageRemove, LocalStorageSet } from "@_helpers/local-storage";
import { ParseInt } from "@_helpers/math";
import { User } from "@_models/account";
import { ApiResponse, ApiResponseCodes } from "@_models/api";
import { CustomObject } from "@_models/app";
import { TokenInfo } from "@_models/token";
import { ApiService } from "@_services/api.service";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, Observable } from "rxjs";
import { map, switchMap, tap } from "rxjs/operators";





@Injectable({
  providedIn: "root"
})

export class TokenService {


  private currentIdLocalStorageKey: string = CurrentUserIdLocalStorageKey;
  private localStorageTtl: number = CurrentUserIdLocalStorageTtl;

  id: number = 0;

  private user: BehaviorSubject<User> = new BehaviorSubject<User>(null);
  readonly user$: Observable<User> = this.user.asObservable();





  // Проверить авторизацию
  get checkAuth(): boolean {
    return !!this.id;
  }





  constructor(
    private httpClient: HttpClient,
    private apiService: ApiService,
    private router: Router
  ) {
    this.updateState();
  }





  // Получить данные из Local Storage
  updateState(): void {
    this.id = GetCurrentUserId();
  }





  // Проверить токен
  checkToken(codes: string[] = []): Observable<string> {
    return this.httpClient.get<ApiResponse>("token/checkToken").pipe(switchMap(
      result => {
        const code: ApiResponseCodes = result.result.code;
        // Сохранить токен
        if (code === "0001") {
          if (this.id === result.result.data.tokenData.user_id) {
            this.saveAuth(result.result.data.tokenData.user_id);
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
  deleteTokenById(tokenId: number, codes: string[] = []): Observable<boolean> {
    return this.httpClient.post<ApiResponse>("token/deleteTokenById", ObjectToFormData({ tokenId })).pipe(
      switchMap(result => this.apiService.checkSwitchMap(result, codes)),
      map(result => result.result.code === "0001")
    );
  }

  // Удалить все токены по ID пользователя
  deleteTokensByUser(hideCurrent: boolean = false, codes: string[] = []): Observable<boolean> {
    return this.httpClient.post<ApiResponse>("token/deleteTokensByUser", ObjectToFormData({ hideCurrent })).pipe(
      switchMap(result => this.apiService.checkSwitchMap(result, codes)),
      map(result => result.result.code === "0001")
    );
  }

  // Сбросить авторизацию
  deleteAuth(): Observable<string> {
    return this.httpClient.post<ApiResponse>("token/deleteToken", null).pipe(
      tap(() => this.deleteCurrentUser()),
      switchMap(result => this.apiService.checkResponse(result.result.code)),
      tap(() => {
        this.id = 0;
        this.deleteCurrentUser();
        this.router.navigate([""]);
      })
    );
  }





  // Преобразование информации о токене
  private convertToken(tokenData: CustomObject<string | number>): TokenInfo {
    const os: string = OsNames.hasOwnProperty(tokenData.os) ? tokenData.os.toString() : "unknown";
    const name: string = BrowserNames.hasOwnProperty(tokenData.browser) ? tokenData.browser.toString() : "Default Browser";
    const version: string = ParseInt(tokenData.browser_version) > 0 ? tokenData.browser_version.toString() : "";
    // Вернуть модель
    return {
      id: ParseInt(tokenData.id),
      token: tokenData.token.toString(),
      createDate: ToDate(tokenData.create_date),
      lastActionDate: ToDate(tokenData.last_action_date),
      userId: ParseInt(tokenData.user_id),
      ip: tokenData.ip.toString(),
      browser: { os, name, version }
    };
  }

  // Запомнить авторизацию
  saveAuth(id: string | number): void {
    this.id = ParseInt(id);
    // Запомнить
    LocalStorageSet(this.currentIdLocalStorageKey, this.id, this.localStorageTtl);
  }

  // Удалить сведения о текущем пользователе
  private deleteCurrentUser(): void {
    LocalStorageRemove(this.currentIdLocalStorageKey);
  }
}
