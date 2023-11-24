import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { LindenmayerFractalsComponent } from "@app/controlers/dev-tools/lindenmayer-fractals/lindenmayer-fractals.component";





@NgModule({
  declarations: [
    LindenmayerFractalsComponent
  ],
  exports: [
    LindenmayerFractalsComponent
  ],
  imports: [
    CommonModule
  ]
})

export class DevToolsModule { }
