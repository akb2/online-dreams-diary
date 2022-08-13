import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { PanelsHeaderComponent } from "@_controlers/panels-header/panels-header.component";





@NgModule({
  declarations: [
    PanelsHeaderComponent
  ],
  exports: [
    PanelsHeaderComponent
  ],
  imports: [
    CommonModule,
    MatIconModule
  ],
})

export class PanelsHeaderModule { }
