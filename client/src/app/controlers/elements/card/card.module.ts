import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatMenuModule } from "@angular/material/menu";
import { RouterModule } from "@angular/router";
import { CoreModule } from "@_modules/core.module";
import { CardComponent } from "./card.component";






// Декоратор
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
    RouterModule
  ]
})

// Класс модуля
export class CardModule { }
