import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { MainBackgroundModule } from "@_controlers/main-background/main-background.module";
import { NotificationsModule } from "@_controlers/notifications/notifications.module";
import { PanelsHeaderModule } from "@_controlers/panels-header/panels-header.module";
import { ScrollModule } from "@_controlers/scroll/scroll.module";
import { CoreModule } from "@_modules/core.module";
import { NavMenuComponent } from "./nav-menu.component";





@NgModule({
  exports: [
    NavMenuComponent,
  ],
  declarations: [
    NavMenuComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    RouterModule,
    MainBackgroundModule,
    ScrollModule,
    PanelsHeaderModule,
    NotificationsModule
  ]
})

export class NavMenuModule { }
