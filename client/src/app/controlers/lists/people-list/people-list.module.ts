import { HighlightKeywordsModule } from "@_controlers/highlight-keywords/highlight-keywordsmodule";
import { LastSeenModule } from "@_controlers/last-seen/last-seen.module";
import { PeopleListComponent } from "@_controlers/people-list/people-list.component";
import { CoreModule } from "@_modules/core.module";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { RouterModule } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";





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
    HighlightKeywordsModule,
    CoreModule,
    TranslateModule,
    LastSeenModule
  ]
})

export class PeopleListModule { }
