import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { User } from "@_models/account";





@Component({
  selector: "app-people-list",
  templateUrl: "./people-list.component.html",
  styleUrls: ["./people-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PeopleListComponent {


  @Input() people: User[];

  baseLink: string = "/profile/";





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
