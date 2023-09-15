import { InformModule } from "@_controlers/inform/inform.module";
import { PopupPhotoViewerModule } from "@_controlers/photo-viewer/photo-viewer.module";
import { CoreModule } from "@_modules/core.module";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { RouterModule } from "@angular/router";
import { CommentListComponent } from "./comment-list.component";





@NgModule({
  declarations: [
    CommentListComponent
  ],
  exports: [
    CommentListComponent
  ],
  imports: [
    CommonModule,
    InformModule,
    RouterModule,
    MatIconModule,
    CoreModule,
    MatTooltipModule,
    MatButtonModule,
    PopupPhotoViewerModule
  ]
})

export class CommentListModule { }
