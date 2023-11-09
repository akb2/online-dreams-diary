import { Viewer3DModule } from "@_controlers/viewer-3d/viewer-3d.module";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { Editor3DComponent } from "./editor-3d.component";





@NgModule({
  declarations: [
    Editor3DComponent
  ],
  exports: [
    Editor3DComponent
  ],
  imports: [
    CommonModule,
    Viewer3DModule
  ]
})

export class Editor3DModule {
}