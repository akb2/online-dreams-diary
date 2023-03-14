import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { CommentEditorComponent } from "./comment-editor.component";





@NgModule({
  declarations: [
    CommentEditorComponent
  ],
  exports: [
    CommentEditorComponent
  ],
  imports: [
    CommonModule
  ]
})

export class CommentEditorModule { }
