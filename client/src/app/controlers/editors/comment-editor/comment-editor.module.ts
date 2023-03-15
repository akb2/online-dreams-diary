import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { PickerModule } from "@ctrl/ngx-emoji-mart";
import { ScrollModule } from "@_controlers/scroll/scroll.module";
import { StringTemplatePipe } from "@_pipes/string-template-pipe";
import { CommentEditorComponent } from "./comment-editor.component";





@NgModule({
  declarations: [
    CommentEditorComponent
  ],
  exports: [
    CommentEditorComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    ScrollModule,
    MatTooltipModule,
    PickerModule
  ],
  providers: [
    StringTemplatePipe
  ]
})

export class CommentEditorModule { }
