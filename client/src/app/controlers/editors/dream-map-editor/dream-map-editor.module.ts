import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { DreamMapEditorComponent } from "@_controlers/dream-map-editor/dream-map-editor.component";
import { DreamMapViewerModule } from "@_controlers/dream-map-viewer/dream-map-viewer.module";
import { CoreModule } from "@_modules/core.module";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatSliderModule } from "@angular/material/slider";
import { InformModule } from "@_controlers/inform/inform.module";





@NgModule({
  declarations: [
    DreamMapEditorComponent
  ],
  exports: [
    DreamMapEditorComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    DreamMapViewerModule,
    MatTooltipModule,
    MatSliderModule,
    InformModule
  ]
})

export class DreamMapEditorModule { }
