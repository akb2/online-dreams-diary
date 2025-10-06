import { ApiResponseMessages, ObjectToFormData, ObjectToParams } from "@_datas/api";
import { ToArray } from "@_datas/app";
import { LocalStorageDefaultTtl, LocalStorageGet, LocalStorageRemove, LocalStorageSet } from "@_helpers/local-storage";
import { CompareObjects } from "@_helpers/objects";
import { ApiResponse, SearchResponce } from "@_models/api";
import { Friend, FriendListMixedResopnse, FriendSearch, FriendStatus, FriendWithUsers } from "@_models/friend";
import { NumberDirection } from "@_models/math";
import { AccountService } from "@_services/account.service";
import { ApiService } from "@_services/api.service";
import { TokenService } from "@_services/token.service";
import { anyToInt } from "@akb2/types-tools";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, catchError, filter, finalize, map, mergeMap, of, pairwise, startWith, switchMap, tap, throwError } from "rxjs";





@Injectable({
  providedIn: "root"
})

export class FriendService {


  private localStorageTtl: number = LocalStorageDefaultTtl;
  private friendsLocalStorageKey: string = "friends";

  private syncFriend: [number, number, number] = [0, 0, 0];
  private firensSubscritionCounter: [number, number, number][] = [];

  private friends: BehaviorSubject<Friend[]> = new BehaviorSubject([]);





  // Загрузить статусы из стора
  private getFriendsFromStore(): void {
    this.friends.next(LocalStorageGet(
      this.friendsLocalStorageKey,
      d => ToArray(d).map(u => u as Friend).filter(u => !!u)
    ));
  }

  // Получить подписку на данные о статусах дружбы
  friends$(inUser: number, outUser: number = 0, sync: boolean = false): Observable<Friend> {
    outUser = outUser > 0
      ? outUser
      : anyToInt(this.tokenService.userId);
    // Обновить счетчик
    let counter: number = this.updateFriendsCounter(inUser, outUser, 1);
    // Подписки
    const observable: Observable<Friend> = this.friends.asObservable().pipe(
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
    outUser = outUser > 0
      ? outUser
      : anyToInt(this.tokenService.userId);
    // Проверка данных
    if (!!friend && (inUser > 0 || outUser > 0)) {
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
    private tokenService: TokenService,
    private accountService: AccountService
  ) {
    this.getFriendsFromStore();
  }





  // Проверка статуса в друзьях
  getFriendStatus(inUser: number, outUser: number = 0, codes: string[] = []): Observable<Friend> {
    outUser = outUser > 0
      ? outUser
      : anyToInt(this.tokenService.userId);
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
    else {
      const friend: Friend = EmptyFriend(inUser, outUser);
      // Сохранить в стор
      this.saveFriendToStore(friend);
      // Вернуть статус
      return of(friend);
    }
  }

  // Поиск пользоватлей
  getList(search: Partial<FriendSearch>, codes: string[] = []): Observable<SearchResponce<FriendWithUsers>> {
    let count: number = 0;
    let limit: number = 0;
    // Вернуть подписку
    return this.httpClient.get<ApiResponse>("friend/getList", { params: ObjectToParams(search, "search_") }).pipe(
      switchMap(result => result.result.code === "0001" || codes.some(testCode => testCode === result.result.code) ?
        of(result.result.data) :
        this.apiService.checkResponse(result.result.code, codes)),
      tap(r => {
        count = r.count ?? 0;
        limit = r.limit ?? 0;
      }),
      map(({ friends }) => !!friends?.length ? friends.map(u => this.friendWithUsersConverter(u)) : []),
      mergeMap((result: FriendWithUsers[]) => of({ count, result, limit }))
    );
  }

  // Смешанный поиск пользователей
  getMixedList(search: Partial<FriendSearch>, codes: string[] = []): Observable<FriendListMixedResopnse> {
    search.type = "mixed";
    // Вернуть подписку
    return this.httpClient.get<ApiResponse>("friend/getList", { params: ObjectToParams(search, "search_") }).pipe(
      switchMap(result => result.result.code === "0001" || codes.some(testCode => testCode === result.result.code) ?
        of(result.result.data) :
        this.apiService.checkResponse(result.result.code, codes)),
      map(data => Object.entries(data as any).reduce((o, [k, { count, limit, friends }]: [string, any]) => ({
        ...o,
        [k]: {
          count: anyToInt(count, 0),
          limit: anyToInt(limit, search?.limit),
          result: !!friends?.length ? friends.map(u => this.friendWithUsersConverter(u)) : []
        }
      }), {}))
    );
  }

  // Действия с записью о статусе в друзьях
  private sendFriendAction(endPoint: FriendActionType, userId: number, codes: string[] = []): Observable<string> {
    return this.httpClient.post<ApiResponse>("friend/" + endPoint, ObjectToFormData({ user_id: userId })).pipe(
      switchMap(result => this.apiService.checkResponse(result.result.code, codes)),
      mergeMap(() => this.getFriendStatus(userId, 0, codes), r => r),
      catchError(e => this.getFriendStatus(userId, 0, codes).pipe(map(() => throwError(e)))),
      mergeMap(() => this.accountService.getUser(this.tokenService.userId), r => r)
    );
  }

  // Отправить заявку в друзья
  addToFriends(userId: number, codes: string[] = []): Observable<string> {
    return this.sendFriendAction("addToFriends", userId, codes);
  }

  // Отменить заявку в друзья
  rejectFriends(userId: number, codes: string[] = []): Observable<string> {
    return this.sendFriendAction("rejectFriends", userId, codes);
  }

  // Подтвердить заявку в друзья
  confirmFriends(userId: number, codes: string[] = []): Observable<string> {
    return this.sendFriendAction("confirmFriends", userId, codes);
  }

  // Удалить из друзей
  cancelFromFriends(userId: number, codes: string[] = []): Observable<string> {
    return this.sendFriendAction("cancelFromFriends", userId, codes);
  }

  // Выйти из аккаунта
  quit(): void {
    this.clearUsersFromStore();
  }





  // Конвертация заявки в друзья
  private friendConverter(data: any, userId: number = 0): Friend {
    const inUserId: number = anyToInt(data?.inUserId) ?? userId;
    const outUserId: number = anyToInt(data?.outUserId ?? this.tokenService.userId);
    const checkUserId: number = inUserId === userId ? outUserId : inUserId;
    const status: FriendStatus = this.friendStatusConverter(anyToInt(data?.status, -1), inUserId, outUserId, checkUserId);
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

  // Конвертация заявки в друзья
  private friendWithUsersConverter(data: any, userId: number = 0): FriendWithUsers {
    const friend: Friend = this.friendConverter(data, userId);
    // Вернуть данные
    return {
      ...friend,
      inUser: this.accountService.userConverter(data?.inUser),
      outUser: this.accountService.userConverter(data?.outUser)
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
    LocalStorageSet(this.friendsLocalStorageKey, friends, this.localStorageTtl);
    // Обновить список
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
    LocalStorageSet(this.friendsLocalStorageKey, friends, this.localStorageTtl);
    // Обновить список
    this.friends.next(friends);
  }

  // Обновить счетчик подписок на статусы дружбы
  private updateFriendsCounter(inUser: number, outUser: number, eventType: NumberDirection = 0): number {
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

  // Очистить данные о пользователях в сторе
  private clearUsersFromStore(): void {
    LocalStorageRemove(this.friendsLocalStorageKey);
    // Обновить список
    this.friends.next([]);
  }
}





// Типы действий с заявками в друзьях
type FriendActionType = "addToFriends" | "rejectFriends" | "confirmFriends" | "cancelFromFriends";





// Пустая запись о дружбе
const EmptyFriend = (inUserId: number, outUserId: number, status: FriendStatus = FriendStatus.NotAutorized) => ({
  id: 0,
  inUserId,
  outUserId,
  inDate: new Date(0),
  outDate: new Date(0),
  status
});
