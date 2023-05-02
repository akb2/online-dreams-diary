import { CardModule } from "@_controlers/card/card.module";
import { CommentEditorModule } from "@_controlers/comment-editor/comment-editor.module";
import { CommentListModule } from "@_controlers/comment-list/comment-list.module";
import { DreamListModule } from "@_controlers/dream-list/dream-list.module";
import { DreamMapViewerModule } from "@_controlers/dream-map-viewer/dream-map-viewer.module";
import { HighlightKeywordsModule } from "@_controlers/highlight-keywords/highlight-keywordsmodule";
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { PageLoaderModule } from '@_controlers/page-loader/page-loader.module';
import { TitleModule } from "@_controlers/title/title.module";
import { CoreModule } from '@_modules/core.module';
import { DiaryViewerRoutingModule } from '@_pages/diary-viewer/diary-viewer-routing.module';
import { DiaryViewerComponent } from '@_pages/diary-viewer/diary-viewer.component';
import { NgModule } from '@angular/core';
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";





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
    CardModule,
    HighlightKeywordsModule,
    TitleModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    DreamListModule
  ]
})

export class DiaryViewerModule { }
