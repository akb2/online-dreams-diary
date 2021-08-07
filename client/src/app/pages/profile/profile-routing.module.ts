import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { DetailProfileComponent } from "@_pages/profile/detail/detail-profile.component";
import { ProfileComponent } from "@_pages/profile/profile.component";
import { SettingsProfileComponent } from "@_pages/profile/settings/settings-profile.component";





const routes: Routes = [{
  path: "",
  component: ProfileComponent,
  children: [
    // Профиль
    {
      path: "",
      data: { title: "Моя страница" },
      component: DetailProfileComponent
    },
    // Редактирование профиля
    {
      path: "settings",
      data: { title: "Настройки" },
      component: SettingsProfileComponent
    }
  ]
}];





@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class ProfileRoutingModule { }
