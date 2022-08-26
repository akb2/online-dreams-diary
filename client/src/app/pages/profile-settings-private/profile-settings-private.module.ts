import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NavMenuModule } from '@_controlers/nav-menu/nav-menu.module';
import { PageLoaderModule } from '@_controlers/page-loader/page-loader.module';
import { ProfileSettingsPrivateComponent } from '@_pages/profile-settings-private/profile-settings-private.component';
import { ProfileSettingsPrivateRoutingModule } from '@_pages/profile-settings-private/profile-settings-private-routing.module';
import { CardModule } from '@_controlers/card/card.module';
import { AutocompleteInputModule } from '@_controlers/autocomplete-input/autocomplete-input.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';





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
    MatButtonModule
  ]
})

export class ProfileSettingsPrivateModule { }
