import { CardModule } from "@_controlers/card/card.module";
import { DreamListModule } from "@_controlers/dream-list/dream-list.module";
import { HighlightKeywordsModule } from "@_controlers/highlight-keywords/highlight-keywordsmodule";
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { PageLoaderModule } from '@_controlers/page-loader/page-loader.module';
import { TitleModule } from "@_controlers/title/title.module";
import { Viewer3DModule } from "@_controlers/viewer-3d/viewer-3d.module";
import { CommentModule } from "@_modules/comment.module";
import { CoreModule } from '@_modules/core.module';
import { DiaryViewerRoutingModule } from '@_pages/diary-viewer/diary-viewer-routing.module';
import { DiaryViewerComponent } from '@_pages/diary-viewer/diary-viewer.component';
import { NgModule } from '@angular/core';
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [
    DiaryViewerComponent
  ],
  imports: [
    CoreModule,
    DiaryViewerRoutingModule,
    NavMenuModule,
    PageLoaderModule,
    Viewer3DModule,
    CommentModule,
    CardModule,
    HighlightKeywordsModule,
    TitleModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    DreamListModule,
    TranslateModule
  ]
})

export class DiaryViewerModule { }
