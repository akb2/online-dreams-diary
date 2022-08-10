import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { PeopleListComponent } from "@_controlers/people-list/people-list.component";





@NgModule({
  declarations: [
    PeopleListComponent
  ],
  exports: [
    PeopleListComponent
  ],
  imports: [
    CommonModule
  ]
})

export class PeopleListModule { }
