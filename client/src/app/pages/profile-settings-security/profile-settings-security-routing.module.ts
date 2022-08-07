import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ProfileSettingsSecurityComponent } from "@_pages/profile-settings-security/profile-settings-security.component";





const routes: Routes = [{
  path: "",
  component: ProfileSettingsSecurityComponent,
  data: { title: "Настройки безопасности" }
}];





@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})

export class ProfileSettingsSecurityRoutingModule { }
