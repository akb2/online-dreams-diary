import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NavMenuSettingsModule } from '@_controlers/nav-menu-settings/nav-menu-settings.module';
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { PageLoaderModule } from '@_controlers/page-loader/page-loader.module';
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
    NavMenuModule,
    PageLoaderModule,
    NavMenuSettingsModule
  ]
})

export class ProfileSettingsAppearanceModule { }
