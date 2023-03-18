import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { CardModule } from "@_controlers/card/card.module";
import { CommentEditorModule } from "@_controlers/comment-editor/comment-editor.module";
import { CommentListModule } from "@_controlers/comment-list/comment-list.module";
import { CommentBlockComponent } from "./comment-block.component";





@NgModule({
  declarations: [
    CommentBlockComponent
  ],
  exports: [
    CommentBlockComponent
  ],
  imports: [
    CommonModule,
    CommentListModule,
    CommentEditorModule,
    CardModule
  ]
})

export class CommentBlockModule { }
