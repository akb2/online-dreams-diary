import { CommentEditorComponent } from "@_controlers/comment-editor/comment-editor.component";
import { CommentListComponent } from "@_controlers/comment-list/comment-list.component";
import { PopupConfirmModule } from "@_controlers/confirm/confirm.module";
import { PopupGraffityModule } from "@_controlers/graffity/graffity.module";
import { InformModule } from "@_controlers/inform/inform.module";
import { LoaderModule } from "@_controlers/loader/loader.module";
import { PaintCanvasModule } from "@_controlers/paint-canvas/paint-canvas.module";
import { PopupPhotoUploaderModule } from "@_controlers/photo-uploader/photo-uploader.module";
import { PopupPhotoViewerComponent } from "@_controlers/photo-viewer/photo-viewer.component";
import { ScrollModule } from "@_controlers/scroll/scroll.module";
import { PopupYoutubeVideoModule } from "@_controlers/youtube-video/youtube-video.module";
import { CoreModule } from "@_modules/core.module";
import { StringTemplatePipe } from "@_pipes/string-template.pipe";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatTooltipModule } from "@angular/material/tooltip";
import { RouterModule } from "@angular/router";
import { PickerModule } from "@ctrl/ngx-emoji-mart";
import { TranslateModule } from "@ngx-translate/core";





@NgModule({
  declarations: [
    CommentListComponent,
    CommentEditorComponent,
    PopupPhotoViewerComponent
  ],
  exports: [
    CommentListComponent,
    CommentEditorComponent,
    PopupPhotoViewerComponent
  ],
  imports: [
    CommonModule,
    InformModule,
    RouterModule,
    MatIconModule,
    CoreModule,
    MatTooltipModule,
    MatButtonModule,
    PopupPhotoUploaderModule,
    PaintCanvasModule,
    LoaderModule,
    ScrollModule,
    MatMenuModule,
    PickerModule,
    PopupGraffityModule,
    TranslateModule,
    PopupConfirmModule,
    PopupYoutubeVideoModule
  ],
  providers: [
    StringTemplatePipe
  ]
})

export class CommentModule { }
