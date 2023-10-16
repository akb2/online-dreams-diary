import { CoreModule } from "@_modules/core.module";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatMenuModule } from "@angular/material/menu";
import { RouterModule } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { CardComponent } from "./card.component";





@NgModule({
  declarations: [
    CardComponent
  ],
  exports: [
    CardComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    MatCardModule,
    MatMenuModule,
    MatButtonModule,
    RouterModule,
    TranslateModule
  ]
})

export class CardModule { }
