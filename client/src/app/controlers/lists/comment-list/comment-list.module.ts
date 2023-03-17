import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { InformModule } from "@_controlers/inform/inform.module";
import { CommentListComponent } from "./comment-list.component";





@NgModule({
  declarations: [
    CommentListComponent
  ],
  exports: [
    CommentListComponent
  ],
  imports: [
    CommonModule,
    InformModule
  ]
})

export class CommentListModule { }
