import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { User, UserSex } from "@_models/account";





@Component({
  selector: "app-people-list",
  templateUrl: "./people-list.component.html",
  styleUrls: ["./people-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PeopleListComponent {


  @Input() people: User[];

  baseLink: string = "/profile/";





  // Проверка пола
  userIsMale(user: User): boolean {
    return user.sex === UserSex.Male;
  }

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
}
