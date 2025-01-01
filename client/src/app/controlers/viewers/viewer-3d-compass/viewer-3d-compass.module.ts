import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from "@ngx-translate/core";
import { Viewer3DCompassComponent } from "./viewer-3d-compass.component";

@NgModule({
  declarations: [
    Viewer3DCompassComponent
  ],
  exports: [
    Viewer3DCompassComponent
  ],
  imports: [
    CommonModule,
    TranslateModule
  ]
})
export class Viewer3DCompassModule { }
