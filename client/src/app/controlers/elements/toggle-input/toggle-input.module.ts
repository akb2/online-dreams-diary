import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { ToggleInputComponent } from "./toggle-input.component";

import { CoreModule } from "@_modules/core.module";





@NgModule({
  exports: [
    ToggleInputComponent
  ],
  declarations: [
    ToggleInputComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatSlideToggleModule
  ]
})





export class ToggleInputModule { }
