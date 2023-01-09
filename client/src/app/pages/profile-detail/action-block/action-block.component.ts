import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from "@angular/core";
import { User, UserSex } from "@_models/account";
import { FriendStatus } from "@_models/friend";
import { AccountService } from "@_services/account.service";
import { FriendService } from "@_services/friend.service";
import { BehaviorSubject, mergeMap, skipWhile, Subject, takeUntil, takeWhile, tap, timer } from "rxjs";





@Component({
  selector: "app-action-block",
  templateUrl: "./action-block.component.html",
  styleUrls: ["./action-block.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ActionBlockComponent implements OnInit, OnDestroy {


  @Input() user: User;
  @Input() itsMyPage: boolean;

  isAutorized: boolean = false;
  friendLoader: boolean = false;

  friendStatus: FriendStatus = FriendStatus.NotAutorized;

  friendStatuses: typeof FriendStatus = FriendStatus;

  private updateFriendStatus$: BehaviorSubject<void> = new BehaviorSubject(null);
  private destroyed$: Subject<void> = new Subject();





  // Проверка пола
  get userIsMale(): boolean {
    return this.user.sex === UserSex.Male;
  }





  constructor(
    private friendService: FriendService,
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.defineFriendStatus();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.updateFriendStatus$.complete();
  }





  // Добавить в друзья
  onAddToFriend(): void {
    if (!this.friendLoader) {
      this.friendLoader = true;
      this.changeDetectorRef.detectChanges();
      // Запрос для добавления
      this.friendService.addToFriends(this.user.id)
        .pipe(takeUntil(this.destroyed$))
        .subscribe(
          () => {
            this.friendLoader = false;
            this.updateFriendStatus$.next();
            this.changeDetectorRef.detectChanges();
          },
          () => {
            this.friendLoader = false;
            this.changeDetectorRef.detectChanges();
          }
        );
    }
  }





  // Обновить состояние заявки в друзья
  private defineFriendStatus(): void {
    if (!this.itsMyPage) {
      this.friendLoader = true;
      this.changeDetectorRef.detectChanges();
      // Запрос обновления статуса
      timer(0, 50)
        .pipe(
          takeUntil(this.destroyed$),
          takeWhile(() => this.user === undefined, true),
          skipWhile(() => this.user === undefined),
          mergeMap(() => this.accountService.user$()),
          mergeMap(() => this.accountService.user$(this.user.id)),
          mergeMap(() => this.friendService.friends$(this.user.id, 0, true)),
          tap(() => {
            this.friendLoader = true;
            this.changeDetectorRef.detectChanges();
          })
        )
        .subscribe(friend => {
          this.friendStatus = friend.status;
          this.friendLoader = false;
          this.changeDetectorRef.detectChanges();
        });
    }
  }
}
