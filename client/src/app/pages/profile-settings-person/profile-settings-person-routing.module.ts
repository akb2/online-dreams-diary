import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ProfileSettingsPersonComponent } from "@_pages/profile-settings-person/profile-settings-person.component";





const routes: Routes = [{
  path: "",
  component: ProfileSettingsPersonComponent,
  data: { title: "Настройки персональных данных" }
}];





@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})

export class ProfileSettingsPersonRoutingModule { }
