import { LoaderModule } from "@_controlers/loader/loader.module";
import { ScrollModule } from "@_controlers/scroll/scroll.module";
import { CoreModule } from "@_modules/core.module";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { PopupPhotoViewerComponent } from "./photo-viewer.component";





@NgModule({
  declarations: [
    PopupPhotoViewerComponent
  ],
  exports: [
    PopupPhotoViewerComponent
  ],
  imports: [
    CoreModule,
    CommonModule,
    MatDialogModule,
    MatIconModule,
    ScrollModule,
    LoaderModule
  ]
})

export class PopupPhotoViewerModule { }
