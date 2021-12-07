import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { NavMenuSettingsComponent } from "@_controlers/nav-menu-settings/nav-menu-settings.component";
import { TitleModule } from "@_controlers/title/title.module";





@NgModule({
  declarations: [
    NavMenuSettingsComponent
  ],
  exports: [
    NavMenuSettingsComponent
  ],
  imports: [
    CommonModule,
    TitleModule
  ]
})

export class NavMenuSettingsModule { }
