import { NavMenuSettingsComponent } from "@_controlers/nav-menu-settings/nav-menu-settings.component";
import { TitleModule } from "@_controlers/title/title.module";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { TranslateModule } from "@ngx-translate/core";





@NgModule({
  declarations: [
    NavMenuSettingsComponent
  ],
  exports: [
    NavMenuSettingsComponent
  ],
  imports: [
    CommonModule,
    TitleModule,
    MatIconModule,
    TranslateModule
  ]
})

export class NavMenuSettingsModule { }
