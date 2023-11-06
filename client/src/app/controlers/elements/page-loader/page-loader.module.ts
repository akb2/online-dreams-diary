import { LoaderModule } from "@_controlers/loader/loader.module";
import { MainBackgroundModule } from "@_controlers/main-background/main-background.module";
import { PageLoaderComponent } from "@_controlers/page-loader/page-loader.component";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";





@NgModule({
  declarations: [
    PageLoaderComponent
  ],
  exports: [
    PageLoaderComponent
  ],
  imports: [
    CommonModule,
    MainBackgroundModule,
    LoaderModule,
    TranslateModule
  ]
})

export class PageLoaderModule { }
