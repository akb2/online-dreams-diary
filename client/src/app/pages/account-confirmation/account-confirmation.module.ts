import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";
import { InformModule } from "@_controlers/inform/inform.module";
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { CoreModule } from "@_modules/core.module";
import { AccountConfirmationRoutingModule } from "@_pages/account-confirmation/account-confirmation-routing.module";
import { AccountConfirmationComponent } from "@_pages/account-confirmation/account-confirmation.component";





@NgModule({
  declarations: [
    AccountConfirmationComponent
  ],
  imports: [
    CoreModule,
    AccountConfirmationRoutingModule,
    NavMenuModule,
    InformModule,
    MatButtonModule,
    RouterModule,
    MatIconModule
  ]
})

export class AccountConfirmationModule { }
