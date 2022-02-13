import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { DreamListComponent } from "@_controlers/dream-list/dream-list.component";
import { CoreModule } from "@_modules/core.module";





@NgModule({
  declarations: [
    DreamListComponent
  ],
  exports: [
    DreamListComponent
  ],
  imports: [
    CommonModule,
    CoreModule
  ]
})

export class DreamListModule { }
