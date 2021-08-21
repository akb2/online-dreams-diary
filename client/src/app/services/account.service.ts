import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { environment } from '@_environments/environment';
import { User, UserAvatarCropDataElement, UserAvatarCropDataKeys, UserRegister, UserSave } from "@_models/account";
import { ApiResponse } from "@_models/api";
import { SimpleObject } from "@_models/app";
import { ApiService } from "@_services/api.service";
import { LocalStorageService } from "@_services/local-storage.service";
import { TokenService } from "@_services/token.service";
import { BehaviorSubject, Observable } from "rxjs";
import { switchMap } from "rxjs/operators";





@Injectable({
  providedIn: "root"
})
export class AccountService {


  private baseUrl: string = environment.baseUrl;
  private httpHeader: SimpleObject = environment.httpHeader;

  private cookieKey: string = "account_service_";
  private cookieLifeTime: number = 604800;

  private user: BehaviorSubject<User> = new BehaviorSubject<User>(null);
  public readonly user$: Observable<User> = this.user.asObservable();

  // Конструктор
  constructor(
    private httpClient: HttpClient,
    private apiService: ApiService,
    private router: Router,
    private localStorageService: LocalStorageService,
    private tokenService: TokenService
  ) {
    this.localStorageService.cookieKey = this.cookieKey;
    this.localStorageService.cookieLifeTime = this.cookieLifeTime;
  }

  // Проверить авторизацию
  public get checkAuth(): boolean {
    return !!this.tokenService.token && !!this.tokenService.id;
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
        this.tokenService.saveAuth(result.result.data.token, result.result.data.id);
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
    return this.getUser(this.tokenService.id, codes);
  }

  // Информация о пользователе
  public getUser(id: string, codes: string[] = []): Observable<string> {
    // Вернуть подписку
    return this.httpClient.get<ApiResponse>(this.baseUrl + "account/getUser?id=" + id, this.httpHeader).pipe(switchMap(
      result => {
        // Сохранить данные текущего пользователя
        if (result.result.code === "0001" && result.result.data?.id === this.tokenService.id) {
          this.saveCurrentUser(result.result.data as User);
          this.user.next(result.result.data as User);
        }
        // Вернуть обработку кодов
        return this.apiService.checkResponse(result.result.code, codes);
      }
    ));
  }

  // Сохранить данные аккаунта
  public saveUserData(userSave: UserSave, codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    Object.entries(userSave).map(value => formData.append(value[0], value[1]));
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(
      this.baseUrl + "account/saveUserData?id=" + this.tokenService.id + "&token=" + this.tokenService.token,
      formData,
      this.httpHeader
    ).pipe(switchMap(result => this.apiService.checkResponse(result.result.code, codes)));
  }



  // Загрузить аватарку
  public uploadAvatar(file: File, codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    formData.append("file", file);
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(
      this.baseUrl + "account/uploadAvatar?id=" + this.tokenService.id + "&token=" + this.tokenService.token,
      formData,
      this.httpHeader
    ).pipe(switchMap(result => this.apiService.checkResponse(result.result.code, codes)));
  }

  // Обрезать аватарку
  public cropAvatar(type: UserAvatarCropDataKeys, coords: UserAvatarCropDataElement, codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    formData.append("type", type);
    formData.append("startX", coords.startX.toString());
    formData.append("startY", coords.startY.toString());
    formData.append("width", coords.width.toString());
    formData.append("height", coords.height.toString());
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(
      this.baseUrl + "account/cropAvatar?id=" + this.tokenService.id + "&token=" + this.tokenService.token,
      formData,
      this.httpHeader
    ).pipe(switchMap(result => this.apiService.checkResponse(result.result.code, codes)));
  }

  // Удалить аватарку
  public deleteAvatar(codes: string[] = []): Observable<string> {
    // Вернуть подписку
    return this.httpClient.delete<ApiResponse>(
      this.baseUrl + "account/deleteAvatar?id=" + this.tokenService.id + "&token=" + this.tokenService.token,
      this.httpHeader
    ).pipe(switchMap(
      result => this.apiService.checkResponse(result.result.code, codes)
    ));
  }





  // Сведения о текущем пользователе
  public getCurrentUser(): User {
    if (this.checkAuth) {
      const userString: string = this.localStorageService.getCookie("current_user");
      if (userString) {
        return JSON.parse(userString) as User;
      }
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
}
