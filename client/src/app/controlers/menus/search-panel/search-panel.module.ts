import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SearchPanelComponent } from "@_controlers/search-panel/search-panel.component";





@NgModule({
  declarations: [
    SearchPanelComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    SearchPanelComponent
  ]
})

export class SearchPanelModule { }
