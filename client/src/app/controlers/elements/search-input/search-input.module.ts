import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { SearchInputComponent } from "./search-input.component";
import { MatRippleModule } from "@angular/material/core";
import { MatIconModule } from "@angular/material/icon";





@NgModule({
  declarations: [
    SearchInputComponent
  ],
  exports: [
    SearchInputComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatRippleModule,
    MatIconModule
  ]
})

export class SearchInputModule { }
