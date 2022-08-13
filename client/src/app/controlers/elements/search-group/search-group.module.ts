import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SearchGroupComponent } from "@_controlers/search-group/search-group.component";





@NgModule({
  declarations: [
    SearchGroupComponent
  ],
  exports: [
    SearchGroupComponent
  ],
  imports: [
    CommonModule
  ]
})

export class SearchGroupModule { }
