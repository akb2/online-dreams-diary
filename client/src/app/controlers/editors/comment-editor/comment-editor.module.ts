import { PopupGraffityModule } from "@_controlers/graffity/graffity.module";
import { ScrollModule } from "@_controlers/scroll/scroll.module";
import { StringTemplatePipe } from "@_pipes/string-template-pipe";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatTooltipModule } from "@angular/material/tooltip";
import { PickerModule } from "@ctrl/ngx-emoji-mart";
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
    PickerModule,
    MatMenuModule,
    PopupGraffityModule
  ],
  providers: [
    StringTemplatePipe
  ]
})

export class CommentEditorModule { }
