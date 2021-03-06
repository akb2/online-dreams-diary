import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { DreamMapViewerComponent } from "@_controlers/dream-map-viewer/dream-map-viewer.component";
import { InformModule } from "@_controlers/inform/inform.module";





@NgModule({
  declarations: [
    DreamMapViewerComponent
  ],
  exports: [
    DreamMapViewerComponent
  ],
  imports: [
    CommonModule,
    InformModule
  ]
})

export class DreamMapViewerModule { }
