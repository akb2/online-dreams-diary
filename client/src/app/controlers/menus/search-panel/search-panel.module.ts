import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
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
    PanelsHeaderModule
  ]
})

export class SearchPanelModule { }
