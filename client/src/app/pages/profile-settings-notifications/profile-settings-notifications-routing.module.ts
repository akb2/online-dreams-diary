import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { profileSettingsNotificationsComponent } from "./profile-settings-notifications.component";





const routes: Routes = [{
  path: "",
  component: profileSettingsNotificationsComponent,
  data: { title: "Уведомления" }
}];





@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})

export class profileSettingsNotificationsRoutingModule { }
