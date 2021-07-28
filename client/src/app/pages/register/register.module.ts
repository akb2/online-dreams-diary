import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatTabsModule } from "@angular/material/tabs";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

import { CoreModule } from "@_modules/core.module";
import { CardModule } from "@_controlers/card/card.module";
import { TextInputModule } from "@_controlers/text-input/text-input.module";
import { ToggleInputModule } from "@_controlers/toggle-input/toggle-input.module";
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { AppRecaptchaModule } from "@_controlers/app-recaptcha/app-recaptcha.module";

import { RegisterRoutingModule } from "./register-routing.module";
import { RegisterComponent } from "./register.component";





@NgModule({
  declarations: [
    RegisterComponent
  ],
  imports: [
    CoreModule,
    RegisterRoutingModule,
    MatButtonModule,
    MatTabsModule,
    CardModule,
    TextInputModule,
    ToggleInputModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    NavMenuModule,
    AppRecaptchaModule
  ]
})





export class RegisterModule { }
