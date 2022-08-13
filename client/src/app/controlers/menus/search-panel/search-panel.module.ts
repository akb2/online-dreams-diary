import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { PanelsHeaderModule } from "@_controlers/panels-header/panels-header.module";
import { SearchPanelComponent } from "@_controlers/search-panel/search-panel.component";





@NgModule({
  declarations: [
    SearchPanelComponent
  ],
  exports: [
    SearchPanelComponent
  ],
  imports: [
    CommonModule,
    PanelsHeaderModule,
    MatButtonModule,
    MatIconModule
  ]
})

export class SearchPanelModule { }
