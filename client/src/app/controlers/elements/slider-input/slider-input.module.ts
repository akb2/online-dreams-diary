import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatSliderModule } from "@angular/material/slider";
import { CoreModule } from "@_modules/core.module";
import { SliderInputComponent } from "./slider-input.component";





@NgModule({
  declarations: [
    SliderInputComponent
  ],
  exports: [
    SliderInputComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatSliderModule,
  ]
})

export class SliderInputModule { }
