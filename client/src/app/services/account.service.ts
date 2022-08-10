import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { environment } from '@_environments/environment';
import { User, UserAvatarCropDataElement, UserAvatarCropDataKeys, UserRegister, UserSave, UserSettings, UserSettingsDto } from "@_models/account";
import { ApiResponse } from "@_models/api";
import { SimpleObject } from "@_models/app";
import { BackgroundImageDatas } from "@_models/appearance";
import { NavMenuType } from "@_models/nav-menu";
import { ApiService } from "@_services/api.service";
import { LocalStorageService } from "@_services/local-storage.service";
import { TokenService } from "@_services/token.service";
import { BehaviorSubject, Observable, of } from "rxjs";
import { map, mergeMap, switchMap } from "rxjs/operators";





@Injectable({
  providedIn: "root"
})

export class AccountService implements OnDestroy {


  private baseUrl: string = environment.baseUrl;
  private httpHeader: SimpleObject = environment.httpHeader;

  private cookieKey: string = "account_service_";
  private cookieLifeTime: number = 604800;

  private user: BehaviorSubject<User> = new BehaviorSubject<User>(null);
  readonly user$: Observable<User> = this.user.asObservable();





  // Проверить авторизацию
  get checkAuth(): boolean {
    return this.tokenService.checkAuth;
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
    private localStorageService: LocalStorageService,
    private tokenService: TokenService
  ) {
    this.configLocalStorage();
  }

  ngOnDestroy(): void {
    this.user.complete();
  }





  // Авторизация
  auth(login: string, password: string, codes: string[] = []): Observable<string> {
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
  register(data: UserRegister, codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    Object.entries(data).map(([k, v]) => formData.append(k, v));
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(this.baseUrl + "account/register", formData, this.httpHeader).pipe(switchMap(
      result => this.apiService.checkResponse(result.result.code, codes)
    ));
  }





  // Информация о текущем пользователе
  syncCurrentUser(codes: string[] = []): Observable<User> {
    return this.getUser(this.tokenService.id, codes);
  }

  // Информация о пользователе
  getUser(id: string | number, codes: string[] = []): Observable<User> {
    // Вернуть подписку
    return this.httpClient.get<ApiResponse>(this.baseUrl + "account/getUser?id=" + id, this.httpHeader).pipe(
      switchMap(
        result => {
          // Сохранить данные текущего пользователя
          if (result.result.code === "0001" && result.result.data?.id === this.tokenService.id) {
            const user: User = this.userConverter(result.result.data);
            // Сохранить данные
            this.saveCurrentUser(user);
            this.user.next(user);
          }
          // Вернуть данные пользователя
          if (result.result.code === "0001" || codes.some(testCode => testCode === result.result.code)) {
            return of(result.result.data);
          }
          // Вернуть обработку кодов
          else {
            return this.apiService.checkResponse(result.result.code, codes);
          }
        }
      ),
      map(user => this.userConverter(user))
    );
  }

  // Сохранить данные аккаунта
  saveUserData(userSave: UserSave, codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    Object.entries(userSave).map(([key, value]) => formData.append(key, value));
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(
      this.baseUrl + "account/saveUserData?id=" + this.tokenService.id + "&token=" + this.tokenService.token,
      formData,
      this.httpHeader
    ).pipe(
      mergeMap(() => this.syncCurrentUser(), (r1, r2) => r1),
      switchMap(result => this.apiService.checkResponse(result.result.code, codes))
    );
  }

  // Сохранить настройки аккаунта
  saveUserSettings(settings: UserSettings, codes: string[] = []): Observable<string> {
    const settingsDto: UserSettingsDto = {
      profileBackground: settings.profileBackground.id,
      profileHeaderType: settings.profileHeaderType as string
    };
    // Тело запроса
    const formData: FormData = new FormData();
    Object.entries(settingsDto).map(([key, value]) => formData.append(key, value));
    // Запрос
    return this.httpClient.post<ApiResponse>(
      this.baseUrl + "account/saveUserSettings?id=" + this.tokenService.id + "&token=" + this.tokenService.token,
      formData,
      this.httpHeader
    ).pipe(
      mergeMap(() => this.syncCurrentUser(), (r1, r2) => r1),
      switchMap(result => this.apiService.checkResponse(result.result.code, codes))
    );
  }

  // Получить возраст пользователя
  getAge(mixedDate: Date | string): number {
    const today: Date = new Date();
    const date: Date = mixedDate ? typeof mixedDate === "string" ? new Date(mixedDate) : mixedDate : new Date();
    let age: number = today.getFullYear() - date.getFullYear();
    const m: number = today.getMonth() - date.getMonth();
    // Вычисление ДР
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    // Вернуть возраст
    return age;
  }





  // Загрузить аватарку
  uploadAvatar(file: File, codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    formData.append("file", file);
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(
      this.baseUrl + "account/uploadAvatar?id=" + this.tokenService.id + "&token=" + this.tokenService.token,
      formData,
      this.httpHeader
    ).pipe(
      mergeMap(() => this.syncCurrentUser(), (r1, r2) => r1),
      switchMap(result => this.apiService.checkResponse(result.result.code, codes))
    );
  }

  // Обрезать аватарку
  cropAvatar(type: UserAvatarCropDataKeys, coords: UserAvatarCropDataElement, codes: string[] = []): Observable<string> {
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
    ).pipe(
      mergeMap(() => this.syncCurrentUser(), (r1, r2) => r1),
      switchMap(result => this.apiService.checkResponse(result.result.code, codes))
    );
  }

  // Удалить аватарку
  deleteAvatar(codes: string[] = []): Observable<string> {
    // Вернуть подписку
    return this.httpClient.delete<ApiResponse>(
      this.baseUrl + "account/deleteAvatar?id=" + this.tokenService.id + "&token=" + this.tokenService.token,
      this.httpHeader
    ).pipe(
      mergeMap(() => this.syncCurrentUser(), (r1, r2) => r1),
      switchMap(result => this.apiService.checkResponse(result.result.code, codes))
    );
  }





  // Сведения о текущем пользователе
  getCurrentUser(): User {
    if (this.checkAuth) {
      this.configLocalStorage();
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
      this.configLocalStorage();
      this.localStorageService.setCookie("current_user", JSON.stringify(user));
    }
  }

  // Преобразовать данные с сервера
  userConverter(data: any): User {
    const background: number = parseInt(data.settings?.profileBackground as unknown as string);
    const headerType: NavMenuType = data.settings.profileHeaderType as NavMenuType;
    // Данные пользователя
    const user: User = {
      ...data,
      id: parseInt(data.id) || 0,
      settings: {
        profileBackground: BackgroundImageDatas.some(d => d.id === background) ? BackgroundImageDatas.find(d => d.id == background) : BackgroundImageDatas[0],
        profileHeaderType: headerType ? headerType : NavMenuType.short
      }
    } as User;
    // Вернуть данные
    return user;
  }
}
