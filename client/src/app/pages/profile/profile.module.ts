import { NgModule } from '@angular/core';
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { CoreModule } from '@_modules/core.module';
import { DetailProfileComponent } from '@_pages/profile/detail/detail-profile.component';
import { ProfileRoutingModule } from '@_pages/profile/profile-routing.module';
import { ProfileComponent } from '@_pages/profile/profile.component';
import { SettingsProfileComponent } from '@_pages/profile/settings/settings-profile.component';







@NgModule({
  declarations: [
    ProfileComponent,
    DetailProfileComponent,
    SettingsProfileComponent
  ],
  imports: [
    CoreModule,
    ProfileRoutingModule,
    NavMenuModule
  ]
})
export class ProfileModule { }
