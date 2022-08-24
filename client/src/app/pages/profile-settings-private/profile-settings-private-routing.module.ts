import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ProfileSettingsPrivateComponent } from "@_pages/profile-settings-private/profile-settings-private.component";





const routes: Routes = [{
  path: "",
  component: ProfileSettingsPrivateComponent,
  data: { title: "Настройки приватности" }
}];





@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})

export class ProfileSettingsPrivateRoutingModule { }
