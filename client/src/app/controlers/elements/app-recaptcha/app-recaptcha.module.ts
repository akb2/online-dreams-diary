import { CoreModule } from "@_modules/core.module";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { TranslateModule } from "@ngx-translate/core";
import { RecaptchaModule } from "ng-recaptcha";
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
    RecaptchaModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule
  ]
})

export class AppRecaptchaModule { }
