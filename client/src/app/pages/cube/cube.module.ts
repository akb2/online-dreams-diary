import { NgModule } from '@angular/core';
import { CubeRoutingModule } from './cube-routing.module';
import { CubeComponent } from './cube.component';

import { CoreModule } from '@_modules/core.module';

import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";





@NgModule({
  declarations: [
    CubeComponent
  ],
  imports: [
    CoreModule,
    CubeRoutingModule,
    NavMenuModule
  ]
})





export class CubeModule { }
