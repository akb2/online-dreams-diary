import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { InformModule } from '@_controlers/inform/inform.module';
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { TitleModule } from '@_controlers/title/title.module';
import { CoreModule } from '@_modules/core.module';
import { ProfileSettingsSecurityRoutingModule } from '@_pages/profile-settings-security/profile-settings-security-routing.module';
import { ProfileSettingsSecurityComponent } from '@_pages/profile-settings-security/profile-settings-security.component';





@NgModule({
  declarations: [
    ProfileSettingsSecurityComponent,
  ],
  imports: [
    ProfileSettingsSecurityRoutingModule,
    CommonModule,
    CoreModule,
    NavMenuModule,
    InformModule,
    MatButtonModule,
    TitleModule
  ]
})

export class ProfileSettingsSecurityModule { }
