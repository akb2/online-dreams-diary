import { BodyScrollModule } from "@_controlers/body-scroll/body-scroll.module";
import { PopupLanguageListModule } from "@_controlers/language-list/language-list.module";
import { LastSeenModule } from "@_controlers/last-seen/last-seen.module";
import { MainBackgroundModule } from "@_controlers/main-background/main-background.module";
import { NotificationsModule } from "@_controlers/notifications/notifications.module";
import { PanelsHeaderModule } from "@_controlers/panels-header/panels-header.module";
import { CoreModule } from "@_modules/core.module";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
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
    BodyScrollModule,
    PanelsHeaderModule,
    NotificationsModule,
    TranslateModule,
    PopupLanguageListModule,
    LastSeenModule
  ]
})

export class NavMenuModule { }
