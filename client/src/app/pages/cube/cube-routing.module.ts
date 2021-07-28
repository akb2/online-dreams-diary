import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { CubeComponent } from "./cube.component";





const routes: Routes = [{ path: "", component: CubeComponent }];





@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})





export class CubeRoutingModule { }
