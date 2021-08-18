import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { PopupCropImageComponent } from "@_controlers/crop-image/crop-image.component";
import { CoreModule } from "@_modules/core.module";





// Декоратор
@NgModule({
  exports: [
    PopupCropImageComponent
  ],
  declarations: [
    PopupCropImageComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    MatDialogModule,
    MatButtonModule
  ]
})

// Класс
export class PopupCropImageModule { }
