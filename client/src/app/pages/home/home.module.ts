import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { CoreModule } from '@_modules/core.module';
import { NgModule } from '@angular/core';
import { TranslateModule } from "@ngx-translate/core";
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';





@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    CoreModule,
    HomeRoutingModule,
    NavMenuModule,
    TranslateModule
  ]
})

export class HomeModule { }
