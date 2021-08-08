import { NgModule } from '@angular/core';
import { ContentMenuModule } from '@_controlers/content-menu/content-menu.module';
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { CoreModule } from '@_modules/core.module';
import { DetailProfileComponent } from '@_pages/profile/detail/detail-profile.component';
import { ProfileRoutingModule } from '@_pages/profile/profile-routing.module';
import { ProfileComponent } from '@_pages/profile/profile.component';
import { SettingsPersonProfileComponent } from '@_pages/profile/settings/person/settings-person.component';
import { SettingsProfileComponent } from '@_pages/profile/settings/settings.component';







@NgModule({
  declarations: [
    ProfileComponent,
    DetailProfileComponent,
    SettingsProfileComponent,
    SettingsPersonProfileComponent
  ],
  imports: [
    CoreModule,
    ProfileRoutingModule,
    NavMenuModule,
    ContentMenuModule
  ]
})
export class ProfileModule { }
