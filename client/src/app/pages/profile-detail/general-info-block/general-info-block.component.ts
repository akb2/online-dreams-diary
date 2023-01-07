import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { User, UserSex } from "@_models/account";





@Component({
  selector: "app-general-info-block",
  templateUrl: "./general-info-block.component.html",
  styleUrls: ["./general-info-block.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class GeneralInfoBlockComponent {


  @Input() user: User;





  // Название поля
  get getUserSexLabel(): string {
    return this.user?.sex === UserSex.Male ? "Мужской" : "Женский";
  }
}
