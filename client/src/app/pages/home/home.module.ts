import { NgModule } from '@angular/core';
import { DreamMapEditorModule } from '@_controlers/dream-map-editor/dream-map-editor.module';
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { CoreModule } from '@_modules/core.module';
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
    DreamMapEditorModule
  ]
})

export class HomeModule { }
