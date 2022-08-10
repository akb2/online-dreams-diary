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


}
