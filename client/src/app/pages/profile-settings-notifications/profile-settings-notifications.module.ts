import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { profileSettingsNotificationsRoutingModule } from "./profile-settings-notifications-routing.module";
import { profileSettingsNotificationsComponent } from "./profile-settings-notifications.component";





@NgModule({
  declarations: [
    profileSettingsNotificationsComponent
  ],
  imports: [
    profileSettingsNotificationsRoutingModule,
    CommonModule,
    NavMenuModule,
    MatSlideToggleModule,
    FormsModule,
    ReactiveFormsModule
  ]
})

export class profileSettingsNotificationsModule { }
