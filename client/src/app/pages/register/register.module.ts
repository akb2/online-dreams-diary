import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatRadioModule } from "@angular/material/radio";
import { MatTabsModule } from "@angular/material/tabs";
import { AppRecaptchaModule } from "@_controlers/app-recaptcha/app-recaptcha.module";
import { CardModule } from "@_controlers/card/card.module";
import { InformModule } from "@_controlers/inform/inform.module";
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { TextInputModule } from "@_controlers/text-input/text-input.module";
import { ToggleInputModule } from "@_controlers/toggle-input/toggle-input.module";
import { CoreModule } from "@_modules/core.module";
import { RegisterRoutingModule } from "./register-routing.module";
import { RegisterComponent } from "./register.component";





@NgModule({
  declarations: [
    RegisterComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    RegisterRoutingModule,
    MatButtonModule,
    MatTabsModule,
    CardModule,
    TextInputModule,
    ToggleInputModule,
    FormsModule,
    ReactiveFormsModule,
    NavMenuModule,
    AppRecaptchaModule,
    InformModule,
    MatFormFieldModule,
    MatRadioModule,
    MatInputModule
  ]
})

export class RegisterModule { }
