import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { InformComponent } from "./inform.component";
import { MatIconModule } from "@angular/material/icon";





@NgModule({
  declarations: [
    InformComponent
  ],
  exports: [
    InformComponent
  ],
  imports: [
    CommonModule,
    MatIconModule
  ]
})

export class InformModule { }
