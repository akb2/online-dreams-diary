import { WaitObservable } from "@_helpers/rxjs";
import { User } from "@_models/account";
import { Friend, FriendStatus } from "@_models/friend";
import { AccountService } from "@_services/account.service";
import { FriendService } from "@_services/friend.service";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from "@angular/core";
import { Observable, Subject, merge, mergeMap, takeUntil } from "rxjs";





@Component({
  selector: "app-people-list",
  templateUrl: "./people-list.component.html",
  styleUrls: ["./people-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PeopleListComponent implements OnInit, OnChanges, OnDestroy {


  @Input() people: User[];
  @Input() oneLine: boolean = false;
  @Input() highlightWords: string[];

  user: User;
  friends: Friend[];

  friendLoader: boolean = false;
  friendBlock: boolean = false;

  baseLink: string = "/profile/";

  friendStatuses: typeof FriendStatus = FriendStatus;

  private friendStatusesDestroyed$: Subject<void> = new Subject();
  private destroyed$: Subject<void> = new Subject();





  // Функция проверки пользователя для обновления списка
  listTrackBy(index: number, user: User): string {
    const dataStrings: string[] = [
      user.id.toString(),
      user.lastActionDate.toISOString(),
      user.sex.toString(),
      user.name.toString(),
      user.lastName.toString(),
      user.online ? "true" : "false",
      user.avatars?.middle ?? ""
    ];
    // Объединить данные
    return dataStrings.join("-");
  }

  // Сравнение с текущим пользователем
  itsMe(checkUser: User): boolean {
    return !!this.user && !!checkUser && this.user?.id === checkUser?.id;
  }

  // Статус заявки в друзья
  getFriend(checkUser: User): Partial<Friend> {
    return this.friends.find(({ inUserId, outUserId }) => inUserId === checkUser.id || outUserId === checkUser.id) ?? {
      status: FriendStatus.NotExists
    };
  }





  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private accountService: AccountService,
    private friendService: FriendService
  ) { }

  ngOnInit(): void {
    this.accountService.user$()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(user => {
        this.user = user;
        this.changeDetectorRef.detectChanges();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes?.people && !!this.people?.length) {
      this.friendStatusesDestroyed$.next();
      this.friendBlock = true;
      this.friends = [];
      this.changeDetectorRef.detectChanges();
      // Список статусов в друзья
      WaitObservable(() => !this.user)
        .pipe(
          mergeMap(() => merge(...this.people.filter(user => !this.itsMe(user)).map(({ id }) => this.friendService.friends$(this.user.id, id)))),
          takeUntil(this.friendStatusesDestroyed$),
          takeUntil(this.destroyed$)
        )
        .subscribe(friend => {
          this.addFriendToList(friend);
          this.friendBlock = false;
          this.changeDetectorRef.detectChanges();
        });
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.friendStatusesDestroyed$.complete();
  }





  // Добавить в друзья
  onAddToFriendList(event: MouseEvent | PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  // Переписка
  onDialogOpen(event: MouseEvent | PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  // Добавить в друзья
  onAddToFriend(user: User): void {
    this.onFriendsEvent(this.friendService.addToFriends(user.id));
  }

  // Отменить заявку в друзья
  onRejectFriends(user: User): void {
    this.onFriendsEvent(this.friendService.rejectFriends(user.id));
  }

  // Подтвердить заявку в друзья
  onConfirmFriends(user: User): void {
    this.onFriendsEvent(this.friendService.confirmFriends(user.id));
  }

  // Удалить из друзей
  onCancelFromFriends(user: User): void {
    this.onFriendsEvent(this.friendService.cancelFromFriends(user.id));
  }


  // Выполнение события с заявками в друзья
  private onFriendsEvent(observable: Observable<string>): void {
    if (!this.friendLoader) {
      this.friendLoader = true;
      this.changeDetectorRef.detectChanges();
      // Запрос для добавления
      observable
        .pipe(takeUntil(this.destroyed$))
        .subscribe(
          () => {
            this.friendLoader = false;
            this.changeDetectorRef.detectChanges();
          },
          () => {
            this.friendLoader = false;
            this.changeDetectorRef.detectChanges();
          }
        );
    }
  }





  // Добавить статус друзей в массив
  private addFriendToList(friend: Friend): void {
    const friends: Friend[] = this.friends ?? [];
    const index: number = friends?.findIndex(f => friend?.id && f?.id && friend.id === f.id) ?? -1;
    // Данные в порядке
    if (!!friend && !!friends) {
      // Заменить существующую
      if (index >= 0) {
        friends[index] = friend;
      }
      // Новая запись
      else {
        friends.push(friend);
      }
      // Обновить
      this.friends = [...friends];
      this.changeDetectorRef.detectChanges();
    }
  }
}
