import { User } from "@_models/account";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";





@Component({
  selector: "app-general-info-block",
  templateUrl: "./general-info-block.component.html",
  styleUrls: ["./general-info-block.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class GeneralInfoBlockComponent {
  @Input() user: User;
}
