import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AccountConfirmationComponent } from "@_pages/account-confirmation/account-confirmation.component";





const routes: Routes = [{
  path: "",
  component: AccountConfirmationComponent,
  data: { title: "Активация аккаунта" }
}];





@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})

export class AccountConfirmationRoutingModule { }
