import { WaitObservable } from "@_helpers/rxjs";
import { User } from "@_models/account";
import { Friend, FriendStatus } from "@_models/friend";
import { Notification } from "@_models/notification";
import { FriendService } from "@_services/friend.service";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Observable, Subject, concatMap, takeUntil } from "rxjs";





@Component({
  selector: "notification-add-to-friend",
  templateUrl: "./add-to-friend.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class NotificationAddToFriendComponent implements OnInit, OnDestroy {

  @Input() notification: Notification;
  @Input() user: User;
  @Input() date: string;

  friend: Friend;
  friendLoader: boolean = false;

  friendStatuses: typeof FriendStatus = FriendStatus;

  private destroyed$: Subject<void> = new Subject();





  constructor(
    private friendService: FriendService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Подписка на статус дружбы
    WaitObservable(() => !this.user)
      .pipe(
        concatMap(() => this.friendService.friends$(this.user.id)),
        takeUntil(this.destroyed$)
      )
      .subscribe(friend => {
        this.friend = friend;
        this.changeDetectorRef.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Добавить в друзья
  onAddToFriend(): void {
    this.onFriendsEvent(this.friendService.addToFriends(this.user.id));
  }

  // Отменить заявку в друзья
  onRejectFriends(): void {
    this.onFriendsEvent(this.friendService.rejectFriends(this.user.id));
  }

  // Подтвердить заявку в друзья
  onConfirmFriends(): void {
    this.onFriendsEvent(this.friendService.confirmFriends(this.user.id));
  }

  // Удалить из друзей
  onCancelFromFriends(): void {
    this.onFriendsEvent(this.friendService.cancelFromFriends(this.user.id));
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
}
