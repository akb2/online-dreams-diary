import { NgModule } from '@angular/core';
import { DreamListModule } from '@_controlers/dream-list/dream-list.module';
import { InformModule } from '@_controlers/inform/inform.module';
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { PageLoaderModule } from '@_controlers/page-loader/page-loader.module';
import { PaginationModule } from '@_controlers/pagination/pagination.module';
import { CoreModule } from '@_modules/core.module';
import { DiaryRoutingModule } from '@_pages/diary/diary-routing.module';
import { DiaryComponent } from '@_pages/diary/diary.component';





@NgModule({
  declarations: [
    DiaryComponent
  ],
  imports: [
    CoreModule,
    DiaryRoutingModule,
    NavMenuModule,
    PageLoaderModule,
    DreamListModule,
    InformModule,
    PaginationModule
  ]
})

export class DiaryModule { }
