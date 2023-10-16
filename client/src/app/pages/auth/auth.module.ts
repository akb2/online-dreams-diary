import { AppRecaptchaModule } from "@_controlers/app-recaptcha/app-recaptcha.module";
import { CardModule } from "@_controlers/card/card.module";
import { InformModule } from "@_controlers/inform/inform.module";
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { TextInputModule } from "@_controlers/text-input/text-input.module";
import { CoreModule } from "@_modules/core.module";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { TranslateModule } from "@ngx-translate/core";
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
    NavMenuModule,
    InformModule,
    AppRecaptchaModule,
    TranslateModule
  ]
})

export class AuthModule { }
