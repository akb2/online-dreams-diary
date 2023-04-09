import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatSliderModule } from "@angular/material/slider";
import { ColorPickerModule } from "@iplab/ngx-color-picker";
import { PaintCanvasComponent } from "./paint-canvas.component";





@NgModule({
  declarations: [
    PaintCanvasComponent
  ],
  exports: [
    PaintCanvasComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    ColorPickerModule
  ]
})

export class PaintCanvasModule { }
