import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { HighlightKeywordsComponent } from "./highlight-keywords.component";

@NgModule({
  declarations: [
    HighlightKeywordsComponent
  ],
  exports: [
    HighlightKeywordsComponent
  ],
  imports: [
    CommonModule
  ]
})

export class HighlightKeywordsModule { }
