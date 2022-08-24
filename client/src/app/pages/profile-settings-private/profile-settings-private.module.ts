import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NavMenuModule } from '@_controlers/nav-menu/nav-menu.module';
import { PageLoaderModule } from '@_controlers/page-loader/page-loader.module';
import { ProfileSettingsPrivateComponent } from '@_pages/profile-settings-private/profile-settings-private.component';
import { ProfileSettingsPrivateRoutingModule } from '@_pages/profile-settings-private/profile-settings-private-routing.module';





@NgModule({
  declarations: [
    ProfileSettingsPrivateComponent,
  ],
  imports: [
    ProfileSettingsPrivateRoutingModule,
    CommonModule,
    NavMenuModule,
    PageLoaderModule
  ]
})

export class ProfileSettingsPrivateModule { }
