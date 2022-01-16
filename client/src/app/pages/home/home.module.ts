import { NgModule } from '@angular/core';
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';

import { CoreModule } from '@_modules/core.module';

import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { DreamMapEditorModule } from '@_controlers/dream-map-editor/dream-map-editor.module';





@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    CoreModule,
    HomeRoutingModule,
    NavMenuModule,
    DreamMapEditorModule
  ]
})





export class HomeModule { }
