import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { environment } from '@_environments/environment';
import { PrivateType, User, UserAvatarCropDataElement, UserAvatarCropDataKeys, UserPrivate, UserPrivateItem, UserPrivateNames, UserRegister, UserSave, UserSettings, UserSettingsDto } from "@_models/account";
import { ApiResponse, Search } from "@_models/api";
import { SimpleObject } from "@_models/app";
import { BackgroundImageDatas } from "@_models/appearance";
import { NavMenuType } from "@_models/nav-menu";
import { ApiService } from "@_services/api.service";
import { LocalStorageService } from "@_services/local-storage.service";
import { TokenService } from "@_services/token.service";
import { BehaviorSubject, Observable, of, Subject } from "rxjs";
import { filter, map, mergeMap, switchMap, takeUntil, tap } from "rxjs/operators";





@Injectable({
  providedIn: "root"
})

export class AccountService implements OnDestroy {


  private baseUrl: string = environment.baseUrl;
  private httpHeader: SimpleObject = environment.httpHeader;

  private cookieKey: string = "account_service_";
  private cookieLifeTime: number = 604800;

  private user: BehaviorSubject<User> = new BehaviorSubject<User>(null);
  readonly user$: Observable<User>;
  readonly destroy$: Subject<void> = new Subject<void>();





  // Проверить авторизацию
  get checkAuth(): boolean {
    return this.tokenService.checkAuth;
  }

  // Инициализация Local Storage
  private configLocalStorage(): void {
    this.localStorageService.cookieKey = this.cookieKey;
    this.localStorageService.cookieLifeTime = this.cookieLifeTime;
  }

  // Настройки приватности по умолчанию
  private get getDefaultUserPrivate(): UserPrivate {
    return {
      myPage: this.getDefaultUserPrivateItem,
      myDreamList: this.getDefaultUserPrivateItem
    };
  }

  // Настройки правила приватности по умолчанию
  get getDefaultUserPrivateItem(): UserPrivateItem {
    return {
      type: PrivateType.public,
      blackList: [],
      whiteList: []
    };
  }





  constructor(
    private httpClient: HttpClient,
    private apiService: ApiService,
    private router: Router,
    private localStorageService: LocalStorageService,
    private tokenService: TokenService
  ) {
    this.configLocalStorage();
    // Подписка на текущего пользователя, изменения только когда значение соответсвует текущей авторизации
    this.user$ = this.user.asObservable().pipe(
      takeUntil(this.destroy$),
      filter(user => (!this.checkAuth && !user) || (this.checkAuth && !!user))
    );
  }

  ngOnDestroy(): void {
    this.user.complete();
    this.destroy$.next();
    this.destroy$.complete();
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
    return this.httpClient.post<ApiResponse>(this.baseUrl + "account/register", formData, this.httpHeader).pipe(
      switchMap(r => this.apiService.checkResponse(r.result.code, codes))
    );
  }

  // Выйти из аккаунта
  quit(): void {
    this.user.next(null);
    this.saveCurrentUser(null);
    this.tokenService.deleteAuth();
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

  // Поиск пользоватлей
  search(search: SearchUser, codes: string[] = []): Observable<Search<User>> {
    const url: string = this.baseUrl + "account/search";
    let count: number = 0;
    let limit: number = 0;
    // Вернуть подписку
    return this.httpClient.get<ApiResponse>(url, this.tokenService.getHttpHeader(search, "search_")).pipe(
      switchMap(
        result => result.result.code === "0001" || codes.some(testCode => testCode === result.result.code) ?
          of(result.result.data) :
          this.apiService.checkResponse(result.result.code, codes)
      ),
      tap(r => {
        count = r.count ?? 0;
        limit = r.limit ?? 0;
      }),
      mergeMap(r => of(!!r?.people?.length ? r.people.map(u => this.userConverter(u)) : [])),
      mergeMap((result: User[]) => of({ count, result, limit }))
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





  // Сменить пароль
  changePassword(currentPassword: string, newPassword: string, codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    formData.append("current_password", currentPassword);
    formData.append("new_password", newPassword);
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(
      this.baseUrl + "account/changePassword?id=" + this.tokenService.id + "&token=" + this.tokenService.token,
      formData,
      this.httpHeader
    ).pipe(
      mergeMap(() => this.syncCurrentUser(), r => r),
      switchMap(r => this.apiService.checkResponse(r.result.code, codes))
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
      mergeMap(() => this.syncCurrentUser(), r => r),
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
    this.configLocalStorage();
    this.localStorageService.setCookie("current_user", !!user ? JSON.stringify(user) : "");
  }

  // Преобразовать данные с сервера
  userConverter(data: any): User {
    const background: number = parseInt(data.settings?.profileBackground as unknown as string);
    const headerType: NavMenuType = data.settings.profileHeaderType as NavMenuType;
    // Права доступа
    const privateRules: UserPrivate = this.userPrivateConverter(data?.private);
    // Данные пользователя
    const user: User = {
      ...data,
      id: parseInt(data.id) || 0,
      settings: {
        profileBackground: BackgroundImageDatas.some(d => d.id === background) ? BackgroundImageDatas.find(d => d.id == background) : BackgroundImageDatas[0],
        profileHeaderType: headerType ? headerType : NavMenuType.short
      },
      private: privateRules
    } as User;
    // Вернуть данные
    return user;
  }

  // Правила приватности пользователя
  userPrivateConverter(data: any): UserPrivate {
    data = !!data ? data : this.getDefaultUserPrivate;
    // Вернуть данные
    return UserPrivateNames
      .map(({ rule }) => rule)
      .map(rule => ({ rule, data: data[rule] ?? this.getDefaultUserPrivateItem }))
      .reduce((o, { rule: k, data: v }) => ({ ...o, [k as keyof UserPrivate]: v }), {} as UserPrivate);
  }
}





// Поиск: входящие данные
export interface SearchUser {
  q?: string;
  sex?: string;
  birthDay?: string;
  birthMonth?: string;
  birthYear?: string;
  page?: number;
  limit?: number;
  ids?: number[];
}
