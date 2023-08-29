import { LoaderModule } from "@_controlers/loader/loader.module";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { InformComponent } from "./inform.component";





@NgModule({
  declarations: [
    InformComponent
  ],
  exports: [
    InformComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    LoaderModule
  ]
})

export class InformModule { }
