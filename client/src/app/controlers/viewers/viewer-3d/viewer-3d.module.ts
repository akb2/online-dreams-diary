import { InformModule } from "@_controlers/inform/inform.module";
import { CoreModule } from "@_modules/core.module";
import { Ceil3dService } from "@_services/3d/ceil-3d.service";
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
    Ceil3dService
  ],
  imports: [
    CommonModule,
    CoreModule,
    InformModule,
    TranslateModule,
    MatProgressBarModule,
    MatIconModule
  ]
})

export class Viewer3DModule {
}
