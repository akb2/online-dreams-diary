import { User } from "@_models/account";
import { FriendSearchType } from "@_models/friend";
import { CustomObjectKey } from "@akb2/types-tools";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges } from "@angular/core";





@Component({
  selector: "friends-block",
  templateUrl: "friends-block.component.html",
  styleUrls: ["friends-block.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class FriendsBlockComponent implements OnChanges {


  @Input() user: User;
  @Input() itsMyPage: boolean;
  @Input() friendType: FriendSearchType = "friends";
  @Input() friends: User[] = [];
  @Input() friendsCount: number = 0;
  @Input() friendLimit: number = 0;

  title: string;





  constructor(
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnChanges(): void {
    this.title = Titles[this.itsMyPage ? "my" : "other"][this.friendType];
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
