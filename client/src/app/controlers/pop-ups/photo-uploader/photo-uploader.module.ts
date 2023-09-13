import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatDialogModule } from "@angular/material/dialog";
import { PopupPhotoUploaderComponent } from "./photo-uploader.component";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { LoaderModule } from "@_controlers/loader/loader.module";
import { MatTooltipModule } from "@angular/material/tooltip";





@NgModule({
  exports: [
    PopupPhotoUploaderComponent
  ],
  declarations: [
    PopupPhotoUploaderComponent
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    LoaderModule,
    MatTooltipModule
  ]
})

export class PopupPhotoUploaderModule { }
