import { InformModule } from "@_controlers/inform/inform.module";
import { Viewer3DCompassModule } from "@_controlers/viewer-3d-compass/viewer-3d-compass.module";
import { CoreModule } from "@_modules/core.module";
import { Ceil3dService } from "@_services/3d/ceil-3d.service";
import { Cursor3DService } from "@_services/3d/cursor-3d.service";
import { Engine3DService } from "@_services/3d/engine-3d.service";
import { Landscape3DService } from "@_services/3d/landscape-3d.service";
import { Sky3DService } from "@_services/3d/sky-3d.service";
import { WorldOcean3DService } from "@_services/3d/world-ocean-3d.service";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { TranslateModule } from "@ngx-translate/core";
import { Viewer3DComponent } from "./viewer-3d.component";

@NgModule({
  declarations: [
    Viewer3DComponent
  ],
  exports: [
    Viewer3DComponent
  ],
  providers: [
    Ceil3dService,
    Engine3DService,
    Landscape3DService,
    Sky3DService,
    Cursor3DService,
    WorldOcean3DService
  ],
  imports: [
    CommonModule,
    CoreModule,
    InformModule,
    TranslateModule,
    MatProgressBarModule,
    MatIconModule,
    Viewer3DCompassModule
  ]
})
export class Viewer3DModule {
}
