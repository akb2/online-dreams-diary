import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { CoreModule } from "@_modules/core.module";
import { ToggleInputComponent } from "./toggle-input.component";





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
