import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ScrollComponent } from "./scroll.component";





@NgModule({
  declarations: [
    ScrollComponent
  ],
  exports: [
    ScrollComponent
  ],
  imports: [
    CommonModule
  ]
})

export class ScrollModule { }
