import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { CardModule } from '@_controlers/card/card.module';
import { PopupCropImageModule } from '@_controlers/crop-image/crop-image.module';
import { ImageUploadModule } from '@_controlers/image-upload/image-upload.module';
import { InformModule } from '@_controlers/inform/inform.module';
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { TextInputModule } from '@_controlers/text-input/text-input.module';
import { ToggleInputModule } from '@_controlers/toggle-input/toggle-input.module';
import { CoreModule } from '@_modules/core.module';
import { ProfileSettingsPersonRoutingModule } from '@_pages/profile-settings-person/profile-settings-person-routing.module';
import { ProfileSettingsPersonComponent } from '@_pages/profile-settings-person/profile-settings-person.component';





@NgModule({
  declarations: [
    ProfileSettingsPersonComponent,
  ],
  imports: [
    ProfileSettingsPersonRoutingModule,
    CommonModule,
    CoreModule,
    FormsModule,
    ReactiveFormsModule,
    NavMenuModule,
    CardModule,
    TextInputModule,
    ToggleInputModule,
    ImageUploadModule,
    MatButtonModule,
    InformModule,
    PopupCropImageModule,
    MatMenuModule
  ]
})

export class ProfileSettingsPersonModule { }
