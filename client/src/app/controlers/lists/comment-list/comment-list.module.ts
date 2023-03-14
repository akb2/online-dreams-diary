import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { CommentListComponent } from "./comment-list.component";





@NgModule({
  declarations: [
    CommentListComponent
  ],
  exports: [
    CommentListComponent
  ],
  imports: [
    CommonModule
  ]
})

export class CommentListModule { }
