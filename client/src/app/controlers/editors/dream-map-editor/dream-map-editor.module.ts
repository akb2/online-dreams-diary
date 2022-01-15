import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { DreamMapEditorComponent } from "@_controlers/dream-map-editor/dream-map-editor.component";
import { DreamMapViewerModule } from "@_controlers/dream-map-viewer/dream-map-viewer.module";





@NgModule({
  declarations: [
    DreamMapEditorComponent
  ],
  exports: [
    DreamMapEditorComponent
  ],
  imports: [
    CommonModule,
    DreamMapViewerModule
  ]
})

export class DreamMapEditorModule { }
