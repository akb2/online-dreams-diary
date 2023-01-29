import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { ObjectToParams } from "@_datas/api";
import { ToArray, ToDate } from "@_datas/app";
import { ParseInt } from "@_helpers/math";
import { CompareArrays } from "@_helpers/objects";
import { User } from "@_models/account";
import { ApiResponse, Search } from "@_models/api";
import { Notification, NotificationData, NotificationSearchRequest, NotificationStatus } from "@_models/notification";
import { AccountService } from "@_services/account.service";
import { ApiService } from "@_services/api.service";
import { LocalStorageService } from "@_services/local-storage.service";
import { BehaviorSubject, concatMap, filter, finalize, map, Observable, of, pairwise, startWith, Subject, switchMap, takeUntil, tap } from "rxjs";





@Injectable({
  providedIn: "root"
})

export class NotificationService implements OnDestroy {


  private cookieKey: string = "notification_service_";
  private cookieLifeTime: number = 604800;
  private notificationsCookieKey: string = "notifications";

  private user: User;

  private syncNotifications: number = 0;
  private notificationsSubscritionCounter: number = 0;

  private notifications: BehaviorSubject<any[]> = new BehaviorSubject([]);
  private newNotificationsCount: Subject<number> = new Subject();

  newNotificationsCount$: Observable<number>;
  private destroyed$: Subject<void> = new Subject();





  // Загрузить статусы из стора
  private getNotificationsFromStore(): void {
    this.configLocalStorage();
    // Добавить в наблюдение
    this.notifications.next(this.localStorageService.getCookie(
      this.notificationsCookieKey,
      d => ToArray(d).map(u => u as any).filter(u => !!u)
    ));
  }

  // Получить подписку на данные о статусах дружбы
  notifications$(sync: boolean = false): Observable<Notification[]> {
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
      map(([, next]) => next)
    );
    const notifications: Notification[] = [...this.notifications.getValue()];
    const notificationObservable: Observable<Notification[]> = (!!notifications?.length && !sync ?
      of(notifications) : (userId > 0 ?
        this.getList({ status: NotificationStatus.any }, codes).pipe(map(({ result }) => result)) :
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
    private apiService: ApiService,
    private localStorageService: LocalStorageService
  ) {
    this.newNotificationsCount$ = this.newNotificationsCount.asObservable().pipe(
      takeUntil(this.destroyed$),
      startWith(0),
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
  getList(search: Partial<NotificationSearchRequest>, codes: string[] = []): Observable<Search<Notification>> {
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
        // Вернуть статус
        return ({ result, count, limit });
      })
    );
  }

  // Количество непрочитанных уведомлений
  getNewCount(codes: string[]): Observable<number> {
    return this.getList({
      status: NotificationStatus.new,
      limit: 1
    }, codes).pipe(
      takeUntil(this.destroyed$),
      map(({ count }) => count),
      tap(count => this.newNotificationsCount.next(count))
    );
  }

  // Выйти из аккаунта
  quit(): void {
    this.clearNotificationsFromStore();
  }





  // Преобразование уведомлений
  private notificationCoverter(mixedData?: any): Notification {
    return !!mixedData ? {
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
    this.configLocalStorage();
    this.localStorageService.setCookie(this.notificationsCookieKey, notifications);
    this.notifications.next(notifications);
  }

  // Инициализация Local Storage
  private configLocalStorage(): void {
    this.localStorageService.cookieKey = this.cookieKey;
    this.localStorageService.cookieLifeTime = this.cookieLifeTime;
  }

  // Очистить данные о пользователях в сторе
  private clearNotificationsFromStore(): void {
    this.configLocalStorage();
    this.localStorageService.deleteCookie(this.notificationsCookieKey);
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
