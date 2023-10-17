import { PopupCropImageComponent } from "@_controlers/crop-image/crop-image.component";
import { InformModule } from "@_controlers/inform/inform.module";
import { CoreModule } from "@_modules/core.module";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { TranslateModule } from "@ngx-translate/core";





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
    MatButtonModule,
    InformModule,
    TranslateModule
  ]
})

export class PopupCropImageModule { }
