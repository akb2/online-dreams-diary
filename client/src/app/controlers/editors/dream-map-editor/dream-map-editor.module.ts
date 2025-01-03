import { DreamMapEditorComponent } from "@_controlers/dream-map-editor/dream-map-editor.component";
import { PopupDreamMapSettingsModule } from "@_controlers/dream-map-settings/dream-map-settings.module";
import { DreamMapViewerModule } from "@_controlers/dream-map-viewer/dream-map-viewer.module";
import { InformModule } from "@_controlers/inform/inform.module";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { MatSliderModule } from "@angular/material/slider";
import { MatTooltipModule } from "@angular/material/tooltip";





@NgModule({
  declarations: [
    DreamMapEditorComponent
  ],
  exports: [
    DreamMapEditorComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    DreamMapViewerModule,
    MatTooltipModule,
    MatSliderModule,
    InformModule,
    PopupDreamMapSettingsModule
  ]
})

export class DreamMapEditorModule { }
