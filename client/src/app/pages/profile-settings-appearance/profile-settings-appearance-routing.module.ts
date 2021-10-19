import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ProfileSettingsAppearanceComponent } from "@_pages/profile-settings-appearance/profile-settings-appearance.component";





const routes: Routes = [{
  path: '',
  component: ProfileSettingsAppearanceComponent,
  data: { title: "Персонализация" }
}];





@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class ProfileSettingsAppearanceRoutingModule { }
