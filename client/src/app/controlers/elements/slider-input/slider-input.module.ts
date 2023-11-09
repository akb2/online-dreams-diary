import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatSliderModule } from "@angular/material/slider";
import { TranslateModule } from "@ngx-translate/core";
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
    TranslateModule
  ]
})

export class SliderInputModule { }
