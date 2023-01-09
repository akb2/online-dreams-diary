import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { ApiResponseMessages, ObjectToParams } from "@_datas/api";
import { ParseInt } from "@_helpers/math";
import { CompareObjects } from "@_helpers/objects";
import { User } from "@_models/account";
import { ApiResponse } from "@_models/api";
import { Friend, FriendStatus } from "@_models/friend";
import { AccountService } from "@_services/account.service";
import { ApiService } from "@_services/api.service";
import { LocalStorageService } from "@_services/local-storage.service";
import { BehaviorSubject, catchError, filter, finalize, map, mergeMap, Observable, of, pairwise, startWith, Subject, switchMap, takeUntil, tap, throwError } from "rxjs";





@Injectable({
  providedIn: "root"
})

export class FriendService implements OnDestroy {


  private cookieKey: string = "friend_service_";
  private cookieLifeTime: number = 604800;
  private friendsCookieKey: string = "friends";

  private user: User;

  private syncFriend: [number, number, number] = [0, 0, 0];
  private firensSubscritionCounter: [number, number, number][] = [];

  private friends: BehaviorSubject<Friend[]> = new BehaviorSubject([]);
  private destroyed$: Subject<void> = new Subject();





  // Загрузить статусы из стора
  private getFriendsFromStore(): void {
    this.configLocalStorage();
    // Данные
    let friends: Friend[] = [];
    // Попытка получения из стора
    try {
      const stringFriends: string = this.localStorageService.getCookie(this.friendsCookieKey);
      const mixedFriends: any = JSON.parse(stringFriends);
      const arrayFriends: any[] = Array.isArray(mixedFriends) ? mixedFriends : [];
      // Проверить данные
      friends = arrayFriends.map(u => u as Friend).filter(u => !!u);
    }
    // Ошибка
    catch (e: any) { }
    // Добавить в наблюдение
    this.friends.next(friends);
  }

  // Получить подписку на данные о статусах дружбы
  friends$(inUser: number, outUser: number = 0, sync: boolean = false): Observable<Friend> {
    outUser = outUser > 0 ? outUser : ParseInt(this.user?.id);
    // Обновить счетчик
    let counter: number = this.updateFriendsCounter(inUser, outUser, 1);
    // Подписки
    const observable: Observable<Friend> = this.friends.asObservable().pipe(
      takeUntil(this.destroyed$),
      startWith(null),
      pairwise(),
      map(([prev, next]) => ([prev ?? [], next ?? []])),
      map(([prev, next]) => ([prev, next].map(us => us?.find(f => this.compareFriend(f, inUser, outUser)) ?? null))),
      filter(([prev, next]) => !CompareObjects(prev, next) || (this.syncFriend[0] === inUser && this.syncFriend[1] === outUser)),
      map(([, next]) => next)
    );
    const friend: Friend = [...this.friends.getValue()].find(f => this.compareFriend(f, inUser, outUser));
    const friendObservable: Observable<Friend> = (!!friend && !sync ?
      of(friend) : (inUser > 0 && outUser > 0 ?
        this.getFriendStatus(inUser, outUser) :
        of(null)
      ));
    // Вернуть подписки
    return friendObservable
      .pipe(
        takeUntil(this.destroyed$),
        mergeMap(() => observable),
        tap(() => {
          if (this.compareFriend(this.syncFriend, inUser, outUser)) {
            const [, , i] = this.syncFriend;
            counter = this.updateFriendsCounter(inUser, outUser);
            // Обновить счетчик
            if (i < counter) {
              this.syncFriend[2]++;
            }
            // Очистить
            else {
              this.syncFriend = [0, 0, 0];
            }
          }
        }),
        finalize(() => this.updateFriendsCounter(inUser, outUser, -1))
      );
  }

  // Сравнение записи о пользователе
  private compareFriend(friend: Friend | number[], inUser: number, outUser: number = 0): boolean {
    outUser = outUser > 0 ? outUser : ParseInt(this.user?.id);
    // Проверка данных
    if (!!friend && inUser > 0 && outUser > 0) {
      const fInUser: number = Array.isArray(friend) ? friend[0] : friend.inUserId;
      const fOutUser: number = Array.isArray(friend) ? friend[1] : friend.outUserId;
      // Проверка
      return (
        (fInUser === inUser && fOutUser === outUser) ||
        (fInUser === outUser && fOutUser === inUser)
      );
    }
    // Не подходит
    return false;
  }





  constructor(
    private httpClient: HttpClient,
    private apiService: ApiService,
    private localStorageService: LocalStorageService,
    private accountService: AccountService
  ) {
    this.getFriendsFromStore();
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
  getFriendStatus(inUser: number, outUser: number = 0, codes: string[] = []): Observable<Friend> {
    outUser = outUser > 0 ? outUser : ParseInt(this.user?.id);
    // Только для авторизованных пользователей
    if (outUser > 0) {
      codes = Array.from(new Set([...codes, "0002"]));
      // Вернуть подписку
      return this.httpClient.get<ApiResponse>("friend/getFriendStatus", {
        params: ObjectToParams({
          "in_user_id": inUser,
          "out_user_id": outUser
        })
      })
        .pipe(
          takeUntil(this.destroyed$),
          switchMap(result => result.result.code === "0001" || codes.includes(result.result.code.toString()) ?
            of(result) :
            this.apiService.checkResponse(result.result.code, codes)
          ),
          map(result => {
            const friend: Friend = result.result.code === "0001" ?
              this.friendConverter(result.result.data, inUser) :
              EmptyFriend(inUser, outUser, FriendStatus.NotExists);
            // Сохранить в стор
            this.saveFriendToStore(friend);
            // Вернуть статус
            return friend;
          }),
          catchError(error => {
            if (!!error?.result?.code && ApiResponseMessages.hasOwnProperty(error.result.code)) {
              this.deleteFriendFromStore(inUser, outUser);
            }
            // Вернуть ошибку
            return throwError(error);
          })
        );
    }
    // Пользователь неавторизован
    return of(EmptyFriend(inUser, outUser));
  }

  // Отправить заявку в друзья
  addToFriends(userId: number, codes: string[] = []): Observable<string> {
    return this.httpClient.get<ApiResponse>("friend/addToFriends", { params: ObjectToParams({ "user_id": userId }) }).pipe(
      takeUntil(this.destroyed$),
      switchMap(result => this.apiService.checkResponse(result.result.code, codes)),
      mergeMap(() => this.getFriendStatus(userId, 0, codes), r => r),
      mergeMap(() => this.accountService.syncCurrentUser(), r => r)
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
    if (!!inUserId && !!outUserId) {
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





  // Инициализация Local Storage
  private configLocalStorage(): void {
    this.localStorageService.cookieKey = this.cookieKey;
    this.localStorageService.cookieLifeTime = this.cookieLifeTime;
  }

  // Сохранить данные о статусе дружбы в стор
  private saveFriendToStore(friend: Friend): void {
    const friends: Friend[] = [...(this.friends.getValue() ?? [])];
    const index: number = friends.findIndex(f => this.compareFriend(f, friend.inUserId, friend.outUserId));
    // Обновить запись
    if (index >= 0) {
      friends[index] = friend;
    }
    // Добавить новую
    else {
      friends.push(friend);
    }
    // Обновить
    this.configLocalStorage();
    this.localStorageService.setCookie(this.friendsCookieKey, !!friends ? JSON.stringify(friends) : "");
    this.friends.next(friends);
  }

  // Удалить запись о дружбе из стора
  private deleteFriendFromStore(inUser: number, outUser: number): void {
    const friends: Friend[] = [...(this.friends.getValue() ?? [])];
    const index: number = friends.findIndex(f => this.compareFriend(f, inUser, outUser));
    // Удалить запись
    if (index >= 0) {
      friends.splice(index, 1);
    }
    // Обновить
    this.configLocalStorage();
    this.localStorageService.setCookie(this.friendsCookieKey, !!friends ? JSON.stringify(friends) : "");
    this.friends.next(friends);
  }

  // Обновить счетчик подписок на статусы дружбы
  private updateFriendsCounter(inUser: number, outUser: number, eventType: -1 | 1 | 0 = 0): number {
    const counterIndex: number = this.firensSubscritionCounter.findIndex(f => this.compareFriend(f, inUser, outUser));
    // Для существующего счетчика
    if (counterIndex >= 0) {
      this.firensSubscritionCounter[counterIndex][2] += eventType;
      // Удалить
      if (this.firensSubscritionCounter[counterIndex][2] <= 0) {
        this.firensSubscritionCounter.splice(counterIndex, 1);
        // Вернуть ноль
        return 0;
      }
      // Вернуть количество
      return this.firensSubscritionCounter[counterIndex][2];
    }
    // Для несуществующего
    else if (eventType === 1) {
      this.firensSubscritionCounter.push([inUser, outUser, 1]);
    }
    // Вернуть ноль
    return 0;
  }
}





// Пустая запись о дружбе
const EmptyFriend = (inUserId: number, outUserId: number, status: FriendStatus = FriendStatus.NotAutorized) => ({
  id: 0,
  inUserId,
  outUserId,
  inDate: new Date(0),
  outDate: new Date(0),
  status
});
