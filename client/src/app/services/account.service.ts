import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { OnlinePeriod, UserPrivateNames } from "@_datas/account";
import { ObjectToFormData, ObjectToParams } from "@_datas/api";
import { ToDate } from "@_datas/app";
import { BackgroundImageDatas } from "@_datas/appearance";
import { ParseInt } from "@_helpers/math";
import { CompareObjects } from "@_helpers/objects";
import { AuthResponce, PrivateType, SearchUser, User, UserAvatarCropDataElement, UserAvatarCropDataKeys, UserPrivate, UserPrivateItem, UserRegister, UserSave, UserSettings, UserSettingsDto, UserSex } from "@_models/account";
import { ApiResponse, ApiResponseCodes, Search } from "@_models/api";
import { NavMenuType } from "@_models/nav-menu";
import { ApiService } from "@_services/api.service";
import { LocalStorageService } from "@_services/local-storage.service";
import { TokenService } from "@_services/token.service";
import { BehaviorSubject, Observable, of, Subject, timer } from "rxjs";
import { catchError, concatMap, filter, finalize, map, mergeMap, pairwise, share, startWith, switchMap, takeUntil, tap } from "rxjs/operators";





@Injectable({
  providedIn: "root"
})

export class AccountService implements OnDestroy {


  private cookieKey: string = "account_service_";
  private cookieLifeTime: number = 604800;
  private usersCookieKey: string = "users";

  private syncUser: [number, number] = [-1, 0];
  private userSubscritionCounter: [number, number][] = [];

  private users: BehaviorSubject<User[]> = new BehaviorSubject([]);
  private destroyed$: Subject<void> = new Subject<void>();





  // Проверить авторизацию
  get checkAuth(): boolean {
    return this.tokenService.checkAuth;
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
  user$(userId: number = 0, sync: boolean = false, codes: string[] = []): Observable<User> {
    userId = userId > 0 ? userId : ParseInt(this.tokenService.id);
    codes.push("8100");
    // Обновить счетчик
    let counter: number = this.updateUserCounter(userId, 1);
    // Подписки
    const observable: Observable<User> = this.users.asObservable().pipe(
      takeUntil(this.destroyed$),
      startWith(undefined),
      pairwise(),
      map(([prev, next]) => ([prev ?? [], next ?? []])),
      map(([prev, next]) => ([prev, next].map(us => us?.find(({ id }) => id === userId) ?? null))),
      map(([prev, next]) => ([
        !!prev ? { ...prev, online: this.isOnlineByDate(prev.lastActionDate) } : prev,
        !!next ? { ...next, online: this.isOnlineByDate(next.lastActionDate) } : next
      ])),
      filter(([prev, next]) => !CompareObjects(prev, next) || this.syncUser[0] === userId),
      map(([, next]) => next)
    );
    const user: User = [...this.users.getValue()].find(({ id }) => id === userId);
    const userObservable: Observable<User> = (!!user && !sync ? of(user) : (userId > 0 ? this.getUser(userId, codes) : of(null))).pipe(
      takeUntil(this.destroyed$),
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
  private getUsersFromStore(): void {
    this.configLocalStorage();
    // Данные
    let users: User[] = [];
    // Попытка получения из стора
    try {
      const stringUsers: string = this.localStorageService.getCookie(this.usersCookieKey);
      const mixedUsers: any = JSON.parse(stringUsers);
      const arrayUsers: any[] = Array.isArray(mixedUsers) ? mixedUsers : [];
      // Проверить данные
      users = arrayUsers.map(this.userConverter).filter(u => !!u);
    }
    // Ошибка
    catch (e: any) { }
    // Добавить в наблюдение
    this.users.next(users);
  }

  // Проверить статус онлайн
  private isOnlineByDate(mixedDate: Date | string): boolean {
    const now: Date = new Date();
    const date: Date = typeof mixedDate === "string" ? new Date(!!mixedDate ? mixedDate : 0) : (!!mixedDate ? mixedDate : new Date(0));
    const period: number = Math.round((now.getTime() - date.getTime()) / 1000);
    // Вернуть результат
    return period < OnlinePeriod;
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
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Авторизация
  auth(login: string, password: string, codes: string[] = []): Observable<AuthResponce> {
    let activateIsAvail: boolean = false;
    const formData: FormData = new FormData();
    formData.append("login", login);
    formData.append("password", password);
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>("account/auth", formData)
      .pipe(
        takeUntil(this.destroyed$),
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
    return this.httpClient.post<ApiResponse>("account/register", formData)
      .pipe(
        takeUntil(this.destroyed$),
        switchMap(r => this.apiService.checkResponse(r.result.code, codes))
      );
  }

  // Активация аккаунта
  activateAccount(user: number, code: string, codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    formData.append("user", user.toString());
    formData.append("code", code);
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>("account/activate", formData)
      .pipe(
        takeUntil(this.destroyed$),
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
    return this.httpClient.post<ApiResponse>("account/createActivationCode", formData)
      .pipe(
        takeUntil(this.destroyed$),
        switchMap(r => this.apiService.checkResponse(r.result.code, codes))
      );
  }

  // Выйти из аккаунта
  quit(): void {
    this.tokenService.deleteAuth()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => this.clearUsersFromStore());
  }

  // Проверка настроек приватности
  checkPrivate(rule: keyof UserPrivate, user: number, codes: string[] = []): Observable<boolean> {
    return this.httpClient.post<ApiResponse>("account/checkPrivate", ObjectToFormData({ rule, user })).pipe(
      switchMap(r => this.apiService.checkResponse(r.result.code, codes)),
      map(code => code === "0001"),
      catchError(code => of(code === "0001")),
    );
  }





  // Автополучение данных о пользователе
  syncUserData(id: string | number = 0, lastEditDate: Date = null): Observable<User> {
    let connect: boolean = false;
    const observable = (id: string | number = 0, lastEditDate: Date = null) => {
      const user: User = this.users.getValue()?.find(({ id: userId }) => userId === ParseInt(id > 0 ? id : this.tokenService.id));
      // Параметры
      id = user?.id ?? id ?? 0;
      lastEditDate = user?.lastEditDate ?? lastEditDate ?? new Date(0);
      connect = true;
      // Параметры
      const params: HttpParams = ObjectToParams({ id, lastEditDate: lastEditDate.toISOString() });
      // Подписка
      return id > 0 ?
        this.httpClient.get<ApiResponse>("account/syncUser", { params }) :
        of({ result: { code: "XXXX" } } as ApiResponse);
    };
    // Вернуть подписку
    return timer(0, 1000).pipe(
      share(),
      takeUntil(this.destroyed$),
      filter(() => !connect),
      concatMap(() => observable(id, lastEditDate).pipe(catchError(e => of(e)))),
      catchError(() => of(null)),
      map(result => {
        const code: string = result?.result?.code.toString();
        const user: User = this.userConverter(result?.result?.data);
        const codes: string[] = ["0001", "8100"];
        // Сохранить данные пользователя
        if (codes.includes(code)) {
          this.saveUserToStore(user);
          // Обновить данные
          id = user?.id ?? id;
          lastEditDate = user?.lastEditDate ?? lastEditDate;
        }
        // Обновить данные
        connect = false;
        // Вернуть данные
        return user;
      })
    );
  }

  // Информация о текущем пользователе
  syncCurrentUser(codes: string[] = []): Observable<User> {
    return this.getUser(this.tokenService.id, codes);
  }

  // Обновить подписчик анонимного пользователя
  syncAnonymousUser(): Observable<User> {
    return of(true).pipe(
      takeUntil(this.destroyed$),
      tap(() => {
        this.syncUser = [0, 0];
        this.users.next([...this.users.getValue()]);
      }),
      map(() => null)
    );
  }

  // Информация о пользователе
  getUser(id: string | number, codes: string[] = []): Observable<User> {
    return this.httpClient.get<ApiResponse>("account/getUser?id=" + id).pipe(
      switchMap(
        result => {
          const user: User = this.userConverter(result.result.data);
          const code: string = result?.result?.code?.toString() ?? "";
          // Сохранить данные пользователя
          if (code === "0001" || code === "8100") {
            this.saveUserToStore(user);
          }
          // Вернуть данные пользователя
          return code === "0001" || codes.some(testCode => testCode === code) ?
            of(user) :
            this.apiService.checkResponse(code, codes);
        }
      )
    );
  }

  // Поиск пользоватлей
  search(search: Partial<SearchUser>, codes: string[] = []): Observable<Search<User>> {
    search.ids = Array.from(new Set(search.ids));
    search.limit = !!search.ids?.length ? search.ids.length : (search.limit ?? 0);
    // Подписка
    return this.httpClient.get<ApiResponse>("account/search", { params: ObjectToParams(search, "search_") }).pipe(
      switchMap(result => {
        const code: string = result?.result?.code?.toString() ?? "";
        const people: User[] = !!result?.result?.data?.people?.length ? result.result.data.people.map(u => this.userConverter(u)) : [];
        const count: number = parseInt(result?.result?.data?.count);
        const limit: number = parseInt(result?.result?.data?.limit);
        // Сохранить данные пользователя
        if (code === "0001") {
          people.forEach(user => this.saveUserToStore(user));
        }
        // Вернуть данные пользователей
        return code === "0001" || codes.some(testCode => testCode === code) ?
          of({ result: people, count, limit }) :
          this.apiService.checkResponse(code, codes)
      })
    );
  }





  // Сменить пароль
  changePassword(currentPassword: string, newPassword: string, codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    formData.append("current_password", currentPassword);
    formData.append("new_password", newPassword);
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>("account/changePassword", formData).pipe(
      switchMap(r => this.apiService.checkResponse(r.result.code, codes))
    );
  }

  // Сохранить данные аккаунта
  saveUserData(userSave: UserSave, codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    Object.entries(userSave).map(([key, value]) => formData.append(key, value));
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>("account/saveUserData", formData).pipe(
      switchMap(result => this.apiService.checkResponse(result.result.code, codes)),
      concatMap(code => code === "0001" ? this.getUser(this.tokenService.id) : of(null), r => r)
    );
  }

  // Обновить статус
  savePageStatus(pageStatus: string, codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    formData.append("pageStatus", pageStatus ?? "");
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>("account/savePageStatus", formData).pipe(
      switchMap(result => this.apiService.checkResponse(result.result.code, codes)),
      concatMap(code => code === "0001" ? this.getUser(this.tokenService.id) : of(null), r => r)
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
    return this.httpClient.post<ApiResponse>("account/saveUserSettings", formData).pipe(
      switchMap(result => this.apiService.checkResponse(result.result.code, codes)),
      concatMap(code => code === "0001" ? this.getUser(this.tokenService.id) : of(null), r => r)
    );
  }

  // Сохранить настройки приватности
  saveUserPrivateSettings(privateDatas: UserPrivate, codes: string[] = []): Observable<string> {
    // Тело запроса
    const formData: FormData = new FormData();
    formData.append("private", JSON.stringify(privateDatas));
    // Запрос
    return this.httpClient.post<ApiResponse>("account/saveUserPrivate", formData).pipe(
      switchMap(result => this.apiService.checkResponse(result.result.code, codes)),
      concatMap(code => code === "0001" ? this.getUser(this.tokenService.id) : of(null), r => r)
    );
  }





  // Загрузить аватарку
  uploadAvatar(file: File, codes: string[] = []): Observable<string> {
    const formData: FormData = new FormData();
    formData.append("file", file);
    // Вернуть подписку
    return this.httpClient.post<ApiResponse>("account/uploadAvatar", formData).pipe(
      switchMap(result => this.apiService.checkResponse(result.result.code, codes)),
      concatMap(code => code === "0001" ? this.getUser(this.tokenService.id) : of(null), r => r)
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
    return this.httpClient.post<ApiResponse>("account/cropAvatar", formData).pipe(
      switchMap(result => this.apiService.checkResponse(result.result.code, codes)),
      concatMap(code => code === "0001" ? this.getUser(this.tokenService.id) : of(null), r => r)
    );
  }

  // Удалить аватарку
  deleteAvatar(codes: string[] = []): Observable<string> {
    return this.httpClient.post<ApiResponse>("account/deleteAvatar", new FormData()).pipe(
      switchMap(result => this.apiService.checkResponse(result.result.code, codes)),
      concatMap(code => code === "0001" ? this.getUser(this.tokenService.id) : of(null), r => r)
    );
  }





  // Инициализация Local Storage
  private configLocalStorage(): void {
    this.localStorageService.cookieKey = this.cookieKey;
    this.localStorageService.cookieLifeTime = this.cookieLifeTime;
  }

  // Преобразовать данные с сервера
  userConverter(data: any): User {
    const background: number = parseInt(data?.settings?.profileBackground as unknown as string);
    const headerType: NavMenuType = data?.settings?.profileHeaderType as NavMenuType;
    // Права доступа
    const privateRules: UserPrivate = this.userPrivateConverter(data?.private);
    // Данные пользователя
    const user: User = {
      ...data,
      id: ParseInt(data?.id),
      sex: ParseInt(data?.sex) as UserSex,
      online: this.isOnlineByDate(ToDate(data?.lastActionDate)),
      lastActionDate: ToDate(data?.lastActionDate),
      lastEditDate: ToDate(data?.lastEditDate),
      hasAccess: !!data?.hasAccess,
      settings: {
        profileBackground: BackgroundImageDatas.find(d => d.id == background) ?? BackgroundImageDatas[0],
        profileHeaderType: headerType ?? NavMenuType.short
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
    const users: User[] = [...(this.users?.getValue() ?? [])];
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
