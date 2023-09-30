import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { TextEditorComponent } from "./text-editor.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";





@NgModule({
  declarations: [
    TextEditorComponent
  ],
  exports: [
    TextEditorComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})

export class TextEditorModule { }
