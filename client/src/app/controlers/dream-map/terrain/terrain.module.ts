import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { DreamMapTerrainComponent } from "@app/controlers/dream-map/terrain/terrain.component";





@NgModule({
  declarations: [
    DreamMapTerrainComponent
  ],
  exports: [
    DreamMapTerrainComponent
  ],
  imports: [
    CommonModule
  ]
})

export class DreamMapTerrainModule { }
