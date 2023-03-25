import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AutocompleteInputModule } from '@_controlers/autocomplete-input/autocomplete-input.module';
import { CardModule } from '@_controlers/card/card.module';
import { NavMenuModule } from '@_controlers/nav-menu/nav-menu.module';
import { PageLoaderModule } from '@_controlers/page-loader/page-loader.module';
import { PopupSearchUsersModule } from '@_controlers/search-users/search-users.module';
import { ProfileSettingsPrivateRoutingModule } from '@_pages/profile-settings-private/profile-settings-private-routing.module';
import { ProfileSettingsPrivateComponent } from '@_pages/profile-settings-private/profile-settings-private.component';





@NgModule({
  declarations: [
    ProfileSettingsPrivateComponent,
  ],
  imports: [
    ProfileSettingsPrivateRoutingModule,
    CommonModule,
    NavMenuModule,
    PageLoaderModule,
    CardModule,
    AutocompleteInputModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    PopupSearchUsersModule
  ]
})

export class ProfileSettingsPrivateModule { }
