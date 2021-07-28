import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RecaptchaModule } from "ng-recaptcha";

import { CoreModule } from "@_modules/core.module";

import { AppRecaptchaComponent } from "./app-recaptcha.component";





@NgModule({
  exports: [
    AppRecaptchaComponent
  ],
  declarations: [
    AppRecaptchaComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    RecaptchaModule
  ]
})





export class AppRecaptchaModule { }
