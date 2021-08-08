import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from '@_controlers/card/card.module';
import { ContentMenuModule } from '@_controlers/content-menu/content-menu.module';
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { TextInputModule } from '@_controlers/text-input/text-input.module';
import { ToggleInputModule } from '@_controlers/toggle-input/toggle-input.module';
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
    FormsModule,
    ReactiveFormsModule,
    NavMenuModule,
    ContentMenuModule,
    CardModule,
    TextInputModule,
    ToggleInputModule,
    CommonModule,
    ProfileRoutingModule
  ]
})
export class ProfileModule { }
