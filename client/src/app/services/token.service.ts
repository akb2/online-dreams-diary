import { ObjectToFormData } from "@_datas/api";
import { BrowserNames, OsNames, ToDate } from "@_datas/app";
import { ParseInt } from "@_helpers/math";
import { ApiResponse, ApiResponseCodes } from "@_models/api";
import { CustomObject } from "@_models/app";
import { TokenInfo } from "@_models/token";
import { ApiService } from "@_services/api.service";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { accountDeleteUserIdAction, accountUserIdSelector } from "@app/reducers/account";
import { Store } from "@ngrx/store";
import { Observable, Subject } from "rxjs";
import { concatMap, first, map, switchMap, takeUntil, tap } from "rxjs/operators";





@Injectable({
  providedIn: "root"
})

export class TokenService {

  userId: number = 0;
  checkAuth: boolean = false;

  private userId$ = this.store$.select(accountUserIdSelector);
  private destroyed$: Subject<void> = new Subject();





  constructor(
    private httpClient: HttpClient,
    private apiService: ApiService,
    private router: Router,
    private store$: Store
  ) {
    this.userId$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(userId => {
        this.userId = userId;
        this.checkAuth = userId > 0;
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Проверить токен
  checkToken(codes: string[] = []): Observable<string> {
    return this.httpClient.get<ApiResponse>("token/checkToken").pipe(
      concatMap(() => this.userId$.pipe(first()), (result, userId) => ({ result, userId })),
      switchMap(({ result, userId }) => {
        const code: ApiResponseCodes = result.result.code;
        const newUserId: number = ParseInt(result?.result?.data?.tokenData?.user_id);
        // Сохранить токен
        if ((code === "0001" && userId !== newUserId) || code !== "0001") {
          this.clearStoreData();
        }
        // Вернуть данные
        return this.apiService.checkResponse(result.result.code, codes);
      })
    );
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
      switchMap(result => this.apiService.checkResponse(result.result.code)),
      tap(() => {
        this.store$.dispatch(accountDeleteUserIdAction());
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

  // Очистить данные из стора
  private clearStoreData() {
    this.store$.dispatch(accountDeleteUserIdAction());
    this.router.navigate([""]);
  }
}
