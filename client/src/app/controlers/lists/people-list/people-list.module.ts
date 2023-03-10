import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { RouterModule } from "@angular/router";
import { HighlightKeywordsModule } from "@_controlers/highlight-keywords/highlight-keywordsmodule";
import { PeopleListComponent } from "@_controlers/people-list/people-list.component";





@NgModule({
  declarations: [
    PeopleListComponent
  ],
  exports: [
    PeopleListComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    RouterModule,
    MatButtonModule,
    MatTooltipModule,
    HighlightKeywordsModule
  ]
})

export class PeopleListModule { }
