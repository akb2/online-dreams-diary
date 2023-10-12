import { ScrollModule } from "@_controlers/scroll/scroll.module";
import { CoreModule } from "@_modules/core.module";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { MatMenuModule } from "@angular/material/menu";
import { MatTooltipModule } from "@angular/material/tooltip";
import { TextEditorComponent } from "./text-editor.component";





@NgModule({
  declarations: [
    TextEditorComponent
  ],
  exports: [
    TextEditorComponent
  ],
  imports: [
    CoreModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    ScrollModule
  ]
})

export class TextEditorModule { }
