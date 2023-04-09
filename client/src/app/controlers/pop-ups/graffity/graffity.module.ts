import { PaintCanvasModule } from "@_controlers/paint-canvas/paint-canvas.module";
import { CoreModule } from "@_modules/core.module";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { PopupGraffityComponent } from "./graffity.component";





@NgModule({
  exports: [
    PopupGraffityComponent
  ],
  declarations: [
    PopupGraffityComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    MatDialogModule,
    MatButtonModule,
    PaintCanvasModule
  ]
})

export class PopupGraffityModule { }
