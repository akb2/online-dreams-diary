import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { CoreModule } from '@_modules/core.module';
import { ProfileSettingsAppearanceRoutingModule } from '@_pages/profile-settings-appearance/profile-settings-appearance-routing.module';
import { ProfileSettingsAppearanceComponent } from '@_pages/profile-settings-appearance/profile-settings-appearance.component';





@NgModule({
  declarations: [
    ProfileSettingsAppearanceComponent,
  ],
  imports: [
    ProfileSettingsAppearanceRoutingModule,
    CommonModule,
    CoreModule,
    NavMenuModule
  ]
})

export class ProfileSettingsAppearanceModule { }
