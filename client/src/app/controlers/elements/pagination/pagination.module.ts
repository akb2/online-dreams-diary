import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { PaginationComponent } from "@_controlers/pagination/pagination.component";
import { MatButtonModule } from "@angular/material/button";





@NgModule({
  declarations: [
    PaginationComponent
  ],
  exports: [
    PaginationComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule
  ]
})

export class PaginationModule { }