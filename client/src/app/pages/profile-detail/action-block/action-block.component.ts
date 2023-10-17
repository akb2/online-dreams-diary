import { User } from "@_models/account";
import { FriendStatus } from "@_models/friend";
import { Language } from "@_models/translate";
import { FriendService } from "@_services/friend.service";
import { LanguageService } from "@_services/language.service";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Observable, Subject, concatMap, skipWhile, takeUntil, takeWhile, tap, timer } from "rxjs";





@Component({
  selector: "app-action-block",
  templateUrl: "./action-block.component.html",
  styleUrls: ["./action-block.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ActionBlockComponent implements OnInit, OnDestroy {


  @Input() user: User;
  @Input() itsMyPage: boolean;
  @Input() shortenForm: boolean = false;

  isAutorized: boolean = false;
  friendLoader: boolean = false;

  needPetrovich: boolean = false;

  friendStatus: FriendStatus = FriendStatus.NotAutorized;

  friendStatuses: typeof FriendStatus = FriendStatus;

  private destroyed$: Subject<void> = new Subject();





  // выделение кнопки личного сообщения
  get highLightMessageButton(): boolean {
    return this.friendStatus === FriendStatus.Friends || this.friendStatus === FriendStatus.OutSubscribe;
  }





  constructor(
    private friendService: FriendService,
    private languageService: LanguageService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.defineFriendStatus();
    // Подписка на языки
    this.languageService.onLanguageChange()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(language => {
        this.needPetrovich = language === Language.ru;
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
          concatMap(() => this.friendService.friends$(this.user.id, 0, false)),
          tap(() => {
            this.friendLoader = true;
            this.changeDetectorRef.detectChanges();
          })
        )
        .subscribe(friend => {
          this.friendStatus = !!friend ? friend.status : FriendStatus.NotAutorized;
          this.friendLoader = false;
          this.changeDetectorRef.detectChanges();
        });
    }
  }
}
