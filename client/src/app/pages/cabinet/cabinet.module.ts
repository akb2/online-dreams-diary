import { NgModule } from '@angular/core';
import { CabinetRoutingModule } from './cabinet-routing.module';
import { CabinetComponent } from './cabinet.component';

import { CoreModule } from '@_modules/core.module';

import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";





@NgModule({
  declarations: [
    CabinetComponent
  ],
  imports: [
    CoreModule,
    CabinetRoutingModule,
    NavMenuModule
  ]
})





export class CabinetModule { }
