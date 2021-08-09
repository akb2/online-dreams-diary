import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { CardModule } from '@_controlers/card/card.module';
import { ContentMenuModule } from '@_controlers/content-menu/content-menu.module';
import { ImageUploadModule } from '@_controlers/image-upload/image-upload.module';
import { InformModule } from '@_controlers/inform/inform.module';
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { TextInputModule } from '@_controlers/text-input/text-input.module';
import { ToggleInputModule } from '@_controlers/toggle-input/toggle-input.module';
import { CoreModule } from '@_modules/core.module';
import { DetailProfileComponent } from '@_pages/profile/detail/detail-profile.component';
import { ProfileRoutingModule } from '@_pages/profile/profile-routing.module';
import { ProfileComponent } from '@_pages/profile/profile.component';
import { SettingsPersonProfileComponent } from '@_pages/profile/settings/person/settings-person.component';
import { SettingsProfileComponent } from '@_pages/profile/settings/settings.component';





// Декоратор
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
    ProfileRoutingModule,
    ImageUploadModule,
    MatButtonModule,
    InformModule
  ]
})

// Модуль
export class ProfileModule { }
