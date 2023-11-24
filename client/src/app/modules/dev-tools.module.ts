import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { LindenmayerFractalsComponent } from "@app/controlers/dev-tools/lindenmayer-fractals/lindenmayer-fractals.component";





const routes: Routes = [{
  path: "",
  component: LindenmayerFractalsComponent,
  data: { title: "Генерация шума" }
}];





@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class DevToolsRoutingModule { }

@NgModule({
  declarations: [
    LindenmayerFractalsComponent
  ],
  exports: [
    LindenmayerFractalsComponent
  ],
  imports: [
    DevToolsRoutingModule,
    CommonModule
  ]
})
export class DevToolsModule { }
