import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatDialogModule } from "@angular/material/dialog";
import { PopupPhotoUploaderComponent } from "./photo-uploader.component";





@NgModule({
  exports: [
    PopupPhotoUploaderComponent
  ],
  declarations: [
    PopupPhotoUploaderComponent
  ],
  imports: [
    CommonModule,
    MatDialogModule
  ]
})

export class PopupPhotoUploaderModule { }
