import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from "@angular/core";
import { User } from "@_models/account";
import { Search } from "@_models/api";
import { CustomObjectKey } from "@_models/app";
import { FriendSearch, FriendSearchType, FriendWithUsers } from "@_models/friend";
import { AccountService } from "@_services/account.service";
import { FriendService } from "@_services/friend.service";
import { catchError, concatMap, map, of, skipWhile, Subject, takeUntil, takeWhile, timer } from "rxjs";





@Component({
  selector: "friends-block",
  templateUrl: "friends-block.component.html",
  styleUrls: ["friends-block.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class FriendsBlockComponent implements OnChanges, OnInit, OnDestroy {


  @Input() user: User;
  @Input() itsMyPage: boolean;
  @Input() friendType: FriendSearchType = "friends";

  title: string;
  friendsCount: number = 0;
  friends: User[] = [];
  friendLimit: number = 4;

  private destroyed$: Subject<void> = new Subject();





  constructor(
    private accountService: AccountService,
    private friendService: FriendService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.title = Titles[this.itsMyPage ? "my" : "other"][this.friendType];
  }

  ngOnInit(): void {
    timer(0, 50)
      .pipe(
        takeUntil(this.destroyed$),
        takeWhile(() => !this.user, true),
        skipWhile(() => !this.user),
        concatMap(() => this.itsMyPage ? of(this.user) : this.accountService.user$()),
        concatMap(() => this.accountService.user$(this.user.id)),
        concatMap(() => this.itsMyPage ? of({}) : this.friendService.friends$(this.user.id)),
        concatMap(() => this.itsMyPage ? of(true) : this.accountService.checkPrivate("myPage", this.user.id)),
        map(hasAccess => ({
          hasAccess,
          search: {
            user: this.user.id,
            type: this.friendType,
            limit: this.friendLimit
          } as Partial<FriendSearch>
        })),
        concatMap(({ hasAccess, search }) => hasAccess ? this.friendService.getList(search, ["0002", "8100"]) : []),
        catchError(() => of({
          count: 0,
          limit: this.friendLimit,
          result: []
        } as Search<FriendWithUsers>))
      )
      .subscribe((data: any) => {
        const { result: friends, count: friendsCount } = data as Search<FriendWithUsers>;
        // Запомнить данные
        this.friends = friends.map(({ inUser, outUser }) => inUser.id === this.user.id ? outUser : inUser);
        this.friendsCount = friendsCount;
        // Обновить
        this.changeDetectorRef.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Ошибка загрузки аватарки пользователя
  onUserAvatarError(friend: User): void {
    friend.avatars = {
      full: "",
      crop: "",
      middle: "",
      small: ""
    };
    // Обновить
    this.changeDetectorRef.detectChanges();
  }
}





// Заголовки блоки
const Titles: CustomObjectKey<"my" | "other", CustomObjectKey<FriendSearchType, string>> = {
  my: {
    friends: "Мои друзья",
    subscribers: "Мои подписчики",
    subscribe: "Мои подписки"
  },
  other: {
    friends: "Друзья",
    subscribers: "Подписчики",
    subscribe: "Подписки"
  }
};
