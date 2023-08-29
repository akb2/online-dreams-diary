import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MainBackgroundModule } from "@_controlers/main-background/main-background.module";
import { PageLoaderComponent } from "@_controlers/page-loader/page-loader.component";
import { LoaderModule } from "@_controlers/loader/loader.module";





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
    LoaderModule
  ]
})

export class PageLoaderModule { }
