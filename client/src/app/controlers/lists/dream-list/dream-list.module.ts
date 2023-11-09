import { CardMenuModule } from "@_controlers/card-menu/card-menu.module";
import { PopupConfirmModule } from "@_controlers/confirm/confirm.module";
import { DreamListComponent } from "@_controlers/dream-list/dream-list.component";
import { HighlightKeywordsModule } from "@_controlers/highlight-keywords/highlight-keywordsmodule";
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
    DreamListComponent
  ],
  exports: [
    DreamListComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    CardMenuModule,
    PopupConfirmModule,
    MatTooltipModule,
    HighlightKeywordsModule,
    TranslateModule
  ]
})

export class DreamListModule { }
