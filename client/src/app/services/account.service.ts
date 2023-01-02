import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { UserPrivateNames } from "@_datas/account";
import { BackgroundImageDatas } from "@_datas/appearance";
import { environment } from '@_environments/environment';
import { ParseInt } from "@_helpers/math";
import { CompareObjects } from "@_helpers/objects";
import { AuthResponce, PrivateType, User, UserAvatarCropDataElement, UserAvatarCropDataKeys, UserPrivate, UserPrivateItem, UserRegister, UserSave, UserSettings, UserSettingsDto, UserSex } from "@_models/account";
import { ApiResponse, ApiResponseCodes, Search } from "@_models/api";
import { SimpleObject } from "@_models/app";
import { NavMenuType } from "@_models/nav-menu";
import { ApiService } from "@_services/api.service";
import { LocalStorageService } from "@_services/local-storage.service";
import { TokenService } from "@_services/token.service";
import { BehaviorSubject, Observable, of, Subject } from "rxjs";
import { catchError, filter, finalize, map, mergeMap, pairwise, startWith, switchMap, takeUntil, tap } from "rxjs/operators";





@Injectable({
  providedIn: "root"
})

export class AccountService implements OnDestroy {


  private baseUrl: string = environment.baseUrl;
  private httpHeader: SimpleObject = environment.httpHeader;

  private cookieKey: string = "account_service_";
  private cookieLifeTime: number = 604800;
  private usersCookieKey: string = "users";

  private syncUser: [number, number] = [-1, 0];
  private userSubscritionCounter: [number, number][] = [];

  readonly users: BehaviorSubject<User[]> = new BehaviorSubject([]);
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

  // Получить подписку на данные о пользователе
  user$(userId: number = 0, sync: boolean = false): Observable<User> {
    userId = userId > 0 ? userId : ParseInt(this.tokenService.id);
    // Обновить счетчик
    let counter: number = this.updateUserCounter(userId, 1);
    // Подписки
    const observable: Observable<User> = this.users.asObservable().pipe(
      takeUntil(this.destroy$),
      startWith(undefined),
      pairwise(),
      map(([prev, next]) => ([prev ?? [], next ?? []])),
      map(([prev, next]) => ([prev, next].map(us => us?.find(({ id }) => id === userId) ?? null))),
      filter(([prev, next]) => !CompareObjects(prev, next) || this.syncUser[0] === userId),
      map(([, next]) => next)
    );
    const user: User = [...this.users.getValue()].find(({ id }) => id === userId);
    const userObservable: Observable<User> = (!!user && !sync ? of(user) : (userId > 0 ? this.getUser(userId) : of(null))).pipe(
      takeUntil(this.destroy$),
      mergeMap(() => observable),
      tap(() => {
        const [id, i] = this.syncUser;
        if (id === userId) {
          counter = this.updateUserCounter(userId);
          // Обновить счетчик
          if (i < counter) {
            this.syncUser[1]++;
          }
          // Очистить
          else {
            this.syncUser = [-1, 0];
          }
        }
      }),
      finalize(() => this.updateUserCounter(userId, -1))
    );
    // Вернуть подписки
    return userObservable;
  }

  // Загрузить пользоватлей из стора
  getUsersFromStore(): void {
    this.configLocalStorage();
    // Данные
    let users: User[] = [];
    // Попытка получения из стора
    try {
      const stringUsers: string = this.localStorageService.getCookie(this.usersCookieKey);
      const mixedUsers: any = JSON.parse(stringUsers);
      const arrayUsers: any[] = Array.isArray(mixedUsers) ? mixedUsers : [];
      // Проверить данные
      users = arrayUsers.map(u => u as User).filter(u => !!u);
    }
    // Ошибка
    catch (e: any) { }
    // Добавить в наблюдение
    this.users.next(users);
  }





  constructor(
    private httpClient: HttpClient,
    private apiService: ApiService,
    private router: Router,
    private localStorageService: LocalStorageService,
    private tokenService: TokenService
  ) {
    this.getUsersFromStore();
  }

  ngOnDestroy(): void {
    this.users.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Авторизация
  auth(login: string, password: string, codes: string[] = []): Observable<AuthResponce> {
    let activateIsAvail: boolean = false;
    const formData: FormData = new FormData();
    formData.append("login", login);
    formData.append("password", password);
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(this.baseUrl + "account/auth", formData, this.httpHeader)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(result => {
          const code: ApiResponseCodes = result.result.code.toString();
          // Доступна ли активация
          activateIsAvail = !!result?.result?.data?.activateIsAvail;
          // Сохранить токен
          if (code === "0001") {
            this.tokenService.saveAuth(result.result.data.token, result.result.data.id);
            this.router.navigate([""]);
          }
          // Обработка ошибки
          return this.apiService.checkResponse(code, codes);
        }),
        map(code => ({ code, activateIsAvail }))
      );
  }

  // Регистрация
  register(data: UserRegister, codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    Object.entries(data).map(([k, v]) => formData.append(k, v));
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(this.baseUrl + "account/register", formData, this.httpHeader)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(r => this.apiService.checkResponse(r.result.code, codes))
      );
  }

  // Активация аккаунта
  activateAccount(user: number, code: string, codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    formData.append("user", user.toString());
    formData.append("code", code);
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(this.baseUrl + "account/activate", formData, this.httpHeader)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(r => this.apiService.checkResponse(r.result.code, codes))
      );
  }

  // Создание ключа активации аккаунта
  createActivationCode(login: string, password: string, captcha: string, codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    formData.append("login", login);
    formData.append("password", password);
    formData.append("captcha", captcha);
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(this.baseUrl + "account/createActivationCode", formData, this.httpHeader)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(r => this.apiService.checkResponse(r.result.code, codes))
      );
  }

  // Выйти из аккаунта
  quit(): void {
    this.tokenService.deleteAuth();
    this.clearUsersFromStore();
  }

  // Проверка настроек приватности
  checkPrivate(rule: keyof UserPrivate, user: number, codes: string[] = []): Observable<boolean> {
    const url: string = this.baseUrl + "account/checkPrivate";
    // Вернуть запрос
    return this.httpClient.get<ApiResponse>(url, this.tokenService.getHttpHeader({ rule, user })).pipe(
      switchMap(r => r.result.code === "0001" || codes.some(testCode => testCode === r.result.code) ?
        of(r.result.code) :
        this.apiService.checkResponse(r.result.code, codes)
      ),
      map(code => code === "0001"),
      catchError(code => of(code === "0001")),
    );
  }





  // Информация о текущем пользователе
  syncCurrentUser(codes: string[] = []): Observable<User> {
    return this.getUser(this.tokenService.id, codes);
  }

  // Обновить подписчик анонимного пользователя
  syncAnonymousUser(): Observable<User> {
    return of(true).pipe(
      takeUntil(this.destroy$),
      tap(() => {
        this.syncUser = [0, 0];
        this.users.next([...this.users.getValue()]);
      }),
      map(() => null)
    );
  }

  // Информация о пользователе
  getUser(id: string | number, codes: string[] = []): Observable<User> {
    // Вернуть подписку
    return this.httpClient.get<ApiResponse>(this.baseUrl + "account/getUser?id=" + id, this.httpHeader).pipe(
      switchMap(
        result => {
          const user: User = this.userConverter(result.result.data);
          // Сохранить данные пользователя
          if (result.result.code === "0001") {
            this.saveUserToStore(user);
          }
          // Вернуть данные пользователя
          return result.result.code === "0001" || codes.some(testCode => testCode === result.result.code) ?
            of(user) :
            this.apiService.checkResponse(result.result.code, codes);
        }
      )
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

  // Обновить статус
  savePageStatus(pageStatus: string, codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    formData.append("pageStatus", pageStatus ?? "");
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>(
      this.baseUrl + "account/savePageStatus?id=" + this.tokenService.id + "&token=" + this.tokenService.token,
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
      mergeMap(() => this.syncCurrentUser(), r => r),
      switchMap(result => this.apiService.checkResponse(result.result.code, codes))
    );
  }

  // Сохранить настройки приватности
  saveUserPrivateSettings(privateDatas: UserPrivate, codes: string[] = []): Observable<string> {
    // Тело запроса
    const formData: FormData = new FormData();
    formData.append("private", JSON.stringify(privateDatas));
    // Запрос
    return this.httpClient.post<ApiResponse>(
      this.baseUrl + "account/saveUserPrivate?id=" + this.tokenService.id + "&token=" + this.tokenService.token,
      formData,
      this.httpHeader
    ).pipe(
      mergeMap(() => this.syncCurrentUser(), r => r),
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
      mergeMap(() => this.syncCurrentUser(), r => r),
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





  // Преобразовать данные с сервера
  userConverter(data: any): User {
    const background: number = parseInt(data?.settings?.profileBackground as unknown as string);
    const headerType: NavMenuType = data?.settings.profileHeaderType as NavMenuType;
    // Права доступа
    const privateRules: UserPrivate = this.userPrivateConverter(data?.private);
    // Данные пользователя
    const user: User = {
      ...data,
      id: ParseInt(data?.id),
      sex: ParseInt(data?.sex) as UserSex,
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

  // Сохранить данные о пользователе в стор
  private saveUserToStore(user: User): void {
    const users: User[] = [...(this.users.getValue() ?? [])];
    const index: number = users.findIndex(({ id }) => id === user.id);
    // Обновить запись
    if (index >= 0) {
      users[index] = user;
    }
    // Добавить новую
    else {
      users.push(user);
    }
    // Обновить
    this.configLocalStorage();
    this.localStorageService.setCookie(this.usersCookieKey, !!users ? JSON.stringify(users) : "");
    this.users.next(users);
  }

  // Очистить данные о пользователях в сторе
  private clearUsersFromStore(): void {
    this.configLocalStorage();
    this.localStorageService.setCookie(this.usersCookieKey, "");
    this.users.next([]);
  }

  // Обновить счетчик подписок на пользователей
  private updateUserCounter(userId: number, eventType: -1 | 1 | 0 = 0): number {
    const counterIndex: number = this.userSubscritionCounter.findIndex(([id]) => id === userId);
    // Для существующего счетчика
    if (counterIndex >= 0) {
      this.userSubscritionCounter[counterIndex][1] += eventType;
      // Удалить
      if (this.userSubscritionCounter[counterIndex][1] <= 0) {
        this.userSubscritionCounter.splice(counterIndex, 1);
        // Вернуть ноль
        return 0;
      }
      // Вернуть количество
      return this.userSubscritionCounter[counterIndex][1];
    }
    // Для несуществующего
    else if (eventType === 1) {
      this.userSubscritionCounter.push([userId, 1]);
    }
    // Вернуть ноль
    return 0;
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
  excludeIds?: number[];
}
