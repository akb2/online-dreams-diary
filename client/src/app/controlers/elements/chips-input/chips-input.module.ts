import { DragDropModule } from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatChipsModule } from "@angular/material/chips";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ChipsInputComponent } from "@_controlers/chips-input/chips-input.component";
import { CoreModule } from "@_modules/core.module";





@NgModule({
  exports: [
    ChipsInputComponent
  ],
  declarations: [
    ChipsInputComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatChipsModule,
    DragDropModule
  ]
})

export class ChipsInputModule { }
