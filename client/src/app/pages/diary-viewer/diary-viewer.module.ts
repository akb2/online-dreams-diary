import { NgModule } from '@angular/core';
import { CardModule } from "@_controlers/card/card.module";
import { CommentEditorModule } from "@_controlers/comment-editor/comment-editor.module";
import { CommentListModule } from "@_controlers/comment-list/comment-list.module";
import { DreamMapViewerModule } from '@_controlers/dream-map-viewer/dream-map-viewer.module';
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { PageLoaderModule } from '@_controlers/page-loader/page-loader.module';
import { CoreModule } from '@_modules/core.module';
import { DiaryViewerRoutingModule } from '@_pages/diary-viewer/diary-viewer-routing.module';
import { DiaryViewerComponent } from '@_pages/diary-viewer/diary-viewer.component';





@NgModule({
  declarations: [
    DiaryViewerComponent
  ],
  imports: [
    CoreModule,
    DiaryViewerRoutingModule,
    NavMenuModule,
    PageLoaderModule,
    DreamMapViewerModule,
    CommentEditorModule,
    CommentListModule,
    CardModule
  ]
})

export class DiaryViewerModule { }
