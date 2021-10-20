import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ContentMenuModule } from '@_controlers/content-menu/content-menu.module';
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { PageLoaderModule } from '@_controlers/page-loader/page-loader.module';
import { ProfileSettingsRoutingModule } from '@_pages/profile-settings/profile-settings-routing.module';
import { ProfileSettingsComponent } from '@_pages/profile-settings/profile-settings.component';





@NgModule({
  declarations: [
    ProfileSettingsComponent,
  ],
  imports: [
    CommonModule,
    NavMenuModule,
    ProfileSettingsRoutingModule,
    ContentMenuModule,
    PageLoaderModule
  ]
})

export class ProfileSettingsModule { }
