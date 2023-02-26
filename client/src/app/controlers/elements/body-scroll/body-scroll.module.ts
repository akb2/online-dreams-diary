import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { BodyScrollComponent } from "./body-scroll.component";





@NgModule({
  declarations: [
    BodyScrollComponent
  ],
  exports: [
    BodyScrollComponent
  ],
  imports: [
    CommonModule
  ]
})

export class BodyScrollModule { }
