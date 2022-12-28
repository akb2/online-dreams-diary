import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { NavMenuType } from "@_models/nav-menu";





@Component({
  selector: "app-account-confirmation",
  templateUrl: "./account-confirmation.component.html",
  styleUrls: ["./account-confirmation.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class AccountConfirmationComponent {


  navMenuType: NavMenuType = NavMenuType.collapse;

  activationLoader: boolean = false;
  activationSuccess: boolean = false;

  private activationCode: string;





  constructor(
    private activatedRoute: ActivatedRoute
  ) {
    this.activationCode = this.activatedRoute?.snapshot?.params?.activationCode?.toString() ?? "";
  }
}
