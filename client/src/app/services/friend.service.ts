import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { ObjectToParams } from "@_datas/api";
import { ParseInt } from "@_helpers/math";
import { User } from "@_models/account";
import { ApiResponse } from "@_models/api";
import { Friend, FriendStatus } from "@_models/friend";
import { AccountService } from "@_services/account.service";
import { ApiService } from "@_services/api.service";
import { map, mergeMap, Observable, of, Subject, switchMap, takeUntil } from "rxjs";





@Injectable({
  providedIn: "root"
})

export class FriendService implements OnDestroy {


  private user: User;

  private destroyed$: Subject<void> = new Subject();





  constructor(
    private httpClient: HttpClient,
    private apiService: ApiService,
    private accountService: AccountService
  ) {
    // Подписка на актуальные сведения о пользователе
    this.accountService.user$()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(user => this.user = user);
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Проверка статуса в друзьях
  getFriendStatus(userId: number, codes: string[] = []): Observable<FriendStatus> {
    codes = Array.from(new Set([...codes, "0002"]));
    // Вернуть подписку
    return this.httpClient.get<ApiResponse>("friends/getFriendStatus", { params: ObjectToParams({ "user_id": userId }) }).pipe(
      takeUntil(this.destroyed$),
      switchMap(result => result.result.code === "0001" || codes.includes(result.result.code.toString()) ?
        of(result) :
        this.apiService.checkResponse(result.result.code, codes)
      ),
      map(result => this.friendConverter(result.result.data?.friend, userId).status)
    );
  }

  // Отправить заявку в друзья
  addToFriends(userId: number, codes: string[] = []): Observable<string> {
    return this.httpClient.get<ApiResponse>("friends/addToFriends", { params: ObjectToParams({ "user_id": userId }) }).pipe(
      takeUntil(this.destroyed$),
      mergeMap(() => this.accountService.syncCurrentUser(), r => r),
      switchMap(result => this.apiService.checkResponse(result.result.code, codes))
    );
  }





  // Конвертация заявки в друзья
  private friendConverter(data: any, userId: number): Friend {
    const inUserId: number = ParseInt(data?.inUserId) ?? userId;
    const outUserId: number = ParseInt(data?.outUserId) ?? this.user?.id;
    const checkUserId: number = inUserId === userId ? outUserId : inUserId;
    const status: FriendStatus = this.friendStatusConverter(ParseInt(data?.status, -1), inUserId, outUserId, checkUserId);
    // Вернуть массив
    return {
      id: data?.id ?? 0,
      status,
      inUserId,
      outUserId,
      inDate: !!data?.inDate ? new Date(data.inDate) : null,
      outDate: !!data?.outDate ? new Date(data.outDate) : null
    };
  }

  // Конвертация статуса заявки в друзья
  private friendStatusConverter(mixedStatus: number, inUserId: number, outUserId: number, checkUserId: number): FriendStatus {
    let status: FriendStatus = FriendStatus.NotAutorized;
    // Пользователь авторизован
    if (inUserId > 0 && outUserId > 0) {
      status = FriendStatus.NotExists;
      // Проверка заявки
      if (mixedStatus >= 0) {
        // В друзьях
        if (mixedStatus === 1) {
          status = FriendStatus.Friends;
        }
        // Заявка не подтверждена
        else if (mixedStatus === 0) {
          status = checkUserId === outUserId ? FriendStatus.OutSubscribe : FriendStatus.InSubscribe;
        }
        // Заявка отклонена
        else if (mixedStatus === 2) {
          status = checkUserId === inUserId ? FriendStatus.OutSubscribe : FriendStatus.InSubscribe;
        }
      }
    }
    // Вернуть статус
    return status;
  }
}
