import { UserSex } from "@_models/account";
import { CustomObjectKey } from "@_models/app";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";





@Component({
  selector: "app-last-seen",
  templateUrl: "./last-seen.component.html",
  styleUrls: ["./last-seen.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class LastSeenComponent {
  @Input() online: boolean = false;
  @Input() date: Date = new Date();
  @Input() dateMask: string = "d.M.y - H:mm";
  @Input() sex: UserSex = UserSex.UnDetected;
}
