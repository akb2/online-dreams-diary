import { ObjectToFormData, ObjectToParams, UrlParamsStringToObject } from "@_datas/api";
import { ToArray, ToDate } from "@_datas/app";
import { LocalStorageDefaultTtl, LocalStorageGet, LocalStorageRemove, LocalStorageSet } from "@_helpers/local-storage";
import { ParseInt } from "@_helpers/math";
import { CompareArrays } from "@_helpers/objects";
import { User } from "@_models/account";
import { ApiResponse, SearchResponce } from "@_models/api";
import { Notification, NotificationData, NotificationSearchRequest, NotificationStatus } from "@_models/notification";
import { AccountService } from "@_services/account.service";
import { ApiService } from "@_services/api.service";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable, Subject, catchError, concatMap, filter, finalize, map, of, pairwise, share, startWith, switchMap, takeUntil, tap, timer } from "rxjs";
import { TokenService } from "./token.service";





@Injectable({
  providedIn: "root"
})

export class NotificationService implements OnDestroy {


  private localStorageTtl: number = LocalStorageDefaultTtl;
  private notificationsLocalStorageKey: string = "notifications";

  private user: User;

  private syncNotifications: number = 0;
  private notificationsSubscritionCounter: number = 0;

  private notifications: BehaviorSubject<any[]> = new BehaviorSubject([]);
  private newNotificationsCount: BehaviorSubject<number> = new BehaviorSubject(-1);

  newNotificationsCount$: Observable<number>;
  private destroyed$: Subject<void> = new Subject();





  // Загрузить статусы из стора
  private getNotificationsFromStore(): void {
    this.notifications.next(LocalStorageGet(
      this.notificationsLocalStorageKey,
      d => ToArray(d).map(u => u as any).filter(u => !!u)
    ));
  }

  // Получить подписку на данные о статусах дружбы
  notifications$(skip: number, limit: number = 20, sync: boolean = false): Observable<Notification[]> {
    const userId: number = ParseInt(this.user?.id);
    const codes: string[] = ["0002"];
    // Обновить счетчик
    let counter: number = this.updateNotificationsCounter(1);
    // Подписки
    const observable: Observable<Notification[]> = this.notifications.asObservable().pipe(
      takeUntil(this.destroyed$),
      startWith(null),
      pairwise(),
      map(([prev, next]) => ([prev ?? [], next ?? []])),
      filter(([prev, next]) => !CompareArrays(prev, next) || this.syncNotifications > 0),
      map(([, next]) => next),
      map(ns => ns.filter((n, k) => k >= skip && k < skip + limit))
    );
    const notifications: Notification[] = [...this.notifications.getValue()];
    const notificationObservable: Observable<Notification[]> = (!!notifications?.length && !sync ?
      of(notifications) : (userId > 0 ?
        this.getList({ status: NotificationStatus.any, limit, skip }, codes).pipe(map(({ result }) => result)) :
        of(null)
      ));
    // Вернуть подписки
    return notificationObservable
      .pipe(
        takeUntil(this.destroyed$),
        concatMap(() => observable),
        tap(() => {
          const i: number = this.syncNotifications;
          counter = this.updateNotificationsCounter();
          // Обновить счетчик
          if (i < counter) {
            this.syncNotifications++;
          }
          // Очистить
          else {
            this.syncNotifications = 0;
          }
        }),
        finalize(() => this.updateNotificationsCounter(-1))
      );
  }





  constructor(
    private httpClient: HttpClient,
    private accountService: AccountService,
    private tokenService: TokenService,
    private apiService: ApiService
  ) {
    this.newNotificationsCount$ = this.newNotificationsCount.asObservable().pipe(
      takeUntil(this.destroyed$),
      startWith(-1),
      pairwise(),
      filter(([prev, next]) => prev !== next),
      map(([, next]) => next)
    );
    // Загрузить уведомления из стора
    this.getNotificationsFromStore();
    // Подписка на актуальные сведения о пользователе
    this.accountService.user$()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(user => this.user = user);
  }

  ngOnDestroy(): void {
    this.newNotificationsCount.complete();
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Получение списка
  getList(search: Partial<NotificationSearchRequest>, codes: string[] = []): Observable<SearchResponce<Notification>> {
    return this.httpClient.get<ApiResponse>("notification/getList", {
      params: ObjectToParams({
        status: search.status ?? NotificationStatus.any,
        skip: search.skip ?? 0,
        limit: search.limit ?? 0
      }, "search_")
    }).pipe(
      takeUntil(this.destroyed$),
      switchMap(result => result.result.code === "0001" || codes.includes(result.result.code.toString()) ?
        of(result.result.data) :
        this.apiService.checkResponse(result.result.code, codes)
      ),
      map(({ notifications, count, limit }) => {
        const result: Notification[] = ToArray(notifications, n => this.notificationCoverter(n)).filter(n => !!n);
        // Сохранить в стор
        result.forEach(n => this.saveNotificationToStore(n));
        this.updateNoReadCounter();
        // Вернуть статус
        return ({ result, count, limit });
      })
    );
  }

  // Получение уведомления по ID
  getById(id: number, codes: string[] = []): Observable<Notification> {
    const params: HttpParams = ObjectToParams({ notice_id: id });
    // Вернуть подписчик
    return this.httpClient.get<ApiResponse>("notification/getById", { params }).pipe(
      takeUntil(this.destroyed$),
      switchMap(result => result.result.code === "0001" || codes.includes(result.result.code.toString()) ?
        of(result.result.data) :
        this.apiService.checkResponse(result.result.code, codes)
      ),
      map(notification => {
        const result: Notification = this.notificationCoverter(notification);
        // Сохранить в стор
        this.saveNotificationToStore(result);
        this.updateNoReadCounter();
        // Вернуть статус
        return result;
      })
    );
  }

  // Количество непрочитанных уведомлений
  getNewNotifications(codes: string[] = []): Observable<Notification> {
    let connect: boolean = false;
    const observable = (mixedId: string | number = 0) => {
      const id: number = ParseInt(this.user?.id ?? mixedId ?? 0);
      // Подключение установлено
      connect = true;
      // Подписка
      return id > 0 ?
        this.httpClient.get("longPolling/get/notification/new/" + id).pipe(catchError(e => of({ ...e, text: "" }))) :
        of({ result: { code: "XXXX" } } as ApiResponse);
    };
    // Вернуть подписку
    return timer(0, 1000).pipe(
      share(),
      takeUntil(this.destroyed$),
      filter(() => !connect),
      concatMap(() => observable(this.tokenService.id)),
      catchError(() => of({ text: "" })),
      map(r => ParseInt(UrlParamsStringToObject(r?.text ?? "")?.notificationId)),
      concatMap(notificationId => notificationId > 0 ? this.getById(notificationId, codes).pipe(catchError(() => of(null))) : of(null)),
      tap(() => connect = false)
    );
  }

  // Отметить уведомления как прочитанные
  readNotifications(ids: number[], codes: string[] = []): Observable<SearchResponce<Notification>> {
    return this.httpClient.post<ApiResponse>("notification/readByIds", ObjectToFormData({ ids })).pipe(
      takeUntil(this.destroyed$),
      switchMap(result => result.result.code === "0001" || codes.includes(result.result.code.toString()) ?
        of(ParseInt(result.result.data)) :
        this.apiService.checkResponse(result.result.code, codes)
      ),
      concatMap(() => this.getList({ ids }))
    );
  }

  // Выйти из аккаунта
  quit(): void {
    this.clearNotificationsFromStore();
  }





  // Обновить счетчик уведомлений
  updateNoReadCounter(): void {
    const notifications: Notification[] = [...(this.notifications.getValue() ?? [])];
    // Добавить значение
    this.newNotificationsCount.next(notifications?.filter(({ id, status }) => id > 0 && status === NotificationStatus.new)?.length ?? 0);
  }

  // Преобразование уведомлений
  private notificationCoverter(mixedData?: any): Notification {
    const id: number = ParseInt(mixedData?.id);
    // Вернуть данные
    return !!mixedData && id > 0 ? {
      id: ParseInt(mixedData?.id),
      userId: ParseInt(mixedData?.userId),
      status: ParseInt(mixedData?.status) as NotificationStatus,
      createDate: ToDate(mixedData?.createDate),
      text: mixedData?.text?.toString() ?? "",
      link: mixedData?.link?.toString() ?? "",
      actionType: mixedData?.actionType?.toString() ?? "",
      data: (mixedData?.data ?? {}) as Partial<NotificationData>
    } : null;
  }

  // Сохранить в стор
  private saveNotificationToStore(notification: Notification): void {
    if (!!notification) {
      const notifications: Notification[] = [...(this.notifications.getValue() ?? [])];
      const index: number = notifications.findIndex(({ id }) => id === notification.id);
      // Обновить запись
      if (index >= 0) {
        notifications[index] = notification;
      }
      // Добавить новую
      else {
        notifications.push(notification);
      }
      // Обновить
      LocalStorageSet(this.notificationsLocalStorageKey, notifications, this.localStorageTtl);
      // Обновить список
      this.notifications.next(notifications);
    }
  }

  // Очистить данные о пользователях в сторе
  private clearNotificationsFromStore(): void {
    LocalStorageRemove(this.notificationsLocalStorageKey);
    this.newNotificationsCount.next(0);
    this.notifications.next([]);
  }

  // Обновить счетчик подписок на статусы дружбы
  private updateNotificationsCounter(eventType: -1 | 1 | 0 = 0): number {
    // Для существующего счетчика
    if (this.notificationsSubscritionCounter > 0) {
      this.notificationsSubscritionCounter += eventType;
      // Удалить
      if (this.notificationsSubscritionCounter <= 0) {
        this.notificationsSubscritionCounter = 0;
        // Вернуть ноль
        return 0;
      }
      // Вернуть количество
      return this.notificationsSubscritionCounter;
    }
    // Для несуществующего
    else if (eventType === 1) {
      this.notificationsSubscritionCounter = 1;
    }
    // Вернуть ноль
    return 0;
  }
}
