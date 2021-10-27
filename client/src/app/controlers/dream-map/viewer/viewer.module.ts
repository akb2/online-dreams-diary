import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { DreamMapTerrainModule } from "@app/controlers/dream-map/terrain/terrain.module";
import { DreamMapViewerComponent } from "@app/controlers/dream-map/viewer/viewer.component";





@NgModule({
  declarations: [
    DreamMapViewerComponent
  ],
  exports: [
    DreamMapViewerComponent
  ],
  imports: [
    CommonModule,
    DreamMapTerrainModule
  ]
})

export class DreamMapViewerModule { }
