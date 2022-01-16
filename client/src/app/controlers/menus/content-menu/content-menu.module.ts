import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ContentMenuComponent } from "@_controlers/content-menu/content-menu.component";
import { CoreModule } from "@_modules/core.module";





@NgModule({
  exports: [
    ContentMenuComponent,
  ],
  declarations: [
    ContentMenuComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    RouterModule
  ]
})

export class ContentMenuModule { }
