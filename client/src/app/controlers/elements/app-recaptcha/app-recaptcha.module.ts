import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
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
    RecaptchaModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule
  ]
})

export class AppRecaptchaModule { }
