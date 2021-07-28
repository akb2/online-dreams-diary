import { NgModule } from "@angular/core";
import { Page404RoutingModule } from "./404-routing.module";
import { Page404Component } from "./404.component";
import { CoreModule } from "@_modules/core.module";

import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";





@NgModule({
  declarations: [
    Page404Component
  ],
  imports: [
    CoreModule,
    Page404RoutingModule,
    NavMenuModule
  ]
})





export class Page404Module { }
