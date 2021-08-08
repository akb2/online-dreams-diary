import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { DetailProfileComponent } from "@_pages/profile/detail/detail-profile.component";
import { ProfileComponent } from "@_pages/profile/profile.component";
import { SettingsPersonProfileComponent } from "@_pages/profile/settings/person/settings-person.component";
import { SettingsProfileComponent } from "@_pages/profile/settings/settings.component";





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
    // Настройки профиля
    {
      path: "settings",
      children: [
        // Навигация по настройкам
        {
          path: "",
          data: { title: "Настройки" },
          component: SettingsProfileComponent,
        },
        // Персональные данные
        {
          path: "person",
          data: { title: "Настройки персональных данных" },
          component: SettingsPersonProfileComponent
        }
      ]
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
