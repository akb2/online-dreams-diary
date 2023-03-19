import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";
import { InformModule } from "@_controlers/inform/inform.module";
import { CoreModule } from "@_modules/core.module";
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
    InformModule,
    RouterModule,
    MatIconModule,
    CoreModule
  ]
})

export class CommentListModule { }
