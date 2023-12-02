import { Viewer3DModule } from "@_controlers/viewer-3d/viewer-3d.module";
import { CoreModule } from "@_modules/core.module";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { TranslateModule } from "@ngx-translate/core";
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
    CoreModule,
    Viewer3DModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule
  ]
})

export class Editor3DModule {
}
