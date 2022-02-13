import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { MatMenuModule } from "@angular/material/menu";
import { RouterModule } from "@angular/router";
import { CardMenuComponent } from "@_controlers/card-menu/card-menu.component";
import { CoreModule } from "@_modules/core.module";





@NgModule({
  exports: [
    CardMenuComponent,
  ],
  declarations: [
    CardMenuComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    RouterModule,
    MatMenuModule,
    MatButtonModule,
    MatDividerModule
  ]
})

export class CardMenuModule { }
