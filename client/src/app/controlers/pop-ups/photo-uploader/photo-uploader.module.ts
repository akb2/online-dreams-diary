import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatDialogModule } from "@angular/material/dialog";
import { PopupPhotoUploaderComponent } from "./photo-uploader.component";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";





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
    MatButtonModule
  ]
})

export class PopupPhotoUploaderModule { }
