import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { User } from "@_models/account";





@Component({
  selector: "app-action-block",
  templateUrl: "./action-block.component.html",
  styleUrls: ["./action-block.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ActionBlockComponent {


  @Input() user: User;
  @Input() itsMyPage: boolean;


}
