import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ProfileSettingsComponent } from "@_pages/profile-settings/profile-settings.component";





const routes: Routes = [{
  path: "",
  component: ProfileSettingsComponent,
  data: { title: "Настройки" }
}];





@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})

export class ProfileSettingsRoutingModule { }
