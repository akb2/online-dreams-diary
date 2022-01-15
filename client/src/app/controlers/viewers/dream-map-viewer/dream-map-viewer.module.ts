import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { DreamMapViewerComponent } from "@_controlers/dream-map-viewer/dream-map-viewer.component";





@NgModule({
  declarations: [
    DreamMapViewerComponent
  ],
  exports: [
    DreamMapViewerComponent
  ],
  imports: [
    CommonModule
  ]
})

export class DreamMapViewerModule { }
