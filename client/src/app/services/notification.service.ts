import { ObjectToFormData, ObjectToParams, UrlParamsStringToObject } from "@_datas/api";
import { ToArray, ToDate } from "@_datas/app";
import { ParseInt } from "@_helpers/math";
import { User } from "@_models/account";
import { ApiResponse, SearchResponce } from "@_models/api";
import { Notification, NotificationData, NotificationSearchRequest, NotificationStatus } from "@_models/notification";
import { AccountService } from "@_services/account.service";
import { ApiService } from "@_services/api.service";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { accountUserIdSelector } from "@app/reducers/account";
import { notificationsAddOneAction, notificationsAddSomeAction, notificationsSelector } from "@app/reducers/notifications";
import { Store } from "@ngrx/store";
import { Observable, Subject, catchError, concatMap, filter, map, of, share, switchMap, take, takeUntil, tap, timer } from "rxjs";





@Injectable({
  providedIn: "root"
})

export class NotificationService implements OnDestroy {

  private user: User;

  notifications$ = this.store$.select(notificationsSelector).pipe(map(notifications => notifications.map(n => this.notificationCoverter(n))));
  private userId$ = this.store$.select(accountUserIdSelector).pipe(take(1));
  private destroyed$: Subject<void> = new Subject();





  constructor(
    private httpClient: HttpClient,
    private accountService: AccountService,
    private apiService: ApiService,
    private store$: Store
  ) {
    this.accountService.user$()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(user => this.user = user);
  }

  ngOnDestroy(): void {
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
        // Добавить в стор
        this.store$.dispatch(notificationsAddSomeAction({ notifications: result }));
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
        // Добавить в стор
        this.store$.dispatch(notificationsAddOneAction({ notification: result }));
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
      concatMap(() => this.userId$),
      concatMap(userId => observable(userId)),
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
}
