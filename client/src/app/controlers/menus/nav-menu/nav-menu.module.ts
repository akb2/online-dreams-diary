import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { HammerModule } from "@angular/platform-browser";

import { CoreModule } from "@_modules/core.module";

import { MainBackgroundModule } from "@_controlers/main-background/main-background.module";
import { ScrollModule } from "@_controlers/scroll/scroll.module";

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
    HammerModule,
    MainBackgroundModule,
    ScrollModule
  ]
})





export class NavMenuModule { }
