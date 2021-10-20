import { NgModule } from '@angular/core';
import { NavMenuModule } from "@_controlers/nav-menu/nav-menu.module";
import { PageLoaderModule } from '@_controlers/page-loader/page-loader.module';
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
    PageLoaderModule
  ]
})

export class DiaryModule { }
