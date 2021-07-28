import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

import { CoreModule } from "@_modules/core.module";
import { CardModule } from "@_controlers/card/card.module";
import { TextInputModule } from "@_controlers/text-input/text-input.module";
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";

import { AuthRoutingModule } from "./auth-routing.module";
import { AuthComponent } from "./auth.component";





@NgModule({
  declarations: [
    AuthComponent
  ],
  imports: [
    CoreModule,
    AuthRoutingModule,
    MatButtonModule,
    CardModule,
    TextInputModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    NavMenuModule
  ]
})





export class AuthModule { }
