import { CardModule } from "@_controlers/card/card.module";
import { CommentModule } from "@_modules/comment.module";
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
    CommonModule,
    CommentModule,
    CardModule
  ]
})

export class CommentBlockModule { }
