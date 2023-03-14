import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { CommentBlockComponent } from "./comment-block.component";





@NgModule({
  declarations: [
    CommentBlockComponent
  ],
  exports: [
    CommentBlockComponent
  ],
  imports: [
    CommonModule
  ]
})

export class CommentBlockModule { }
