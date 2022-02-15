import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { RouterModule } from "@angular/router";
import { DreamListComponent } from "@_controlers/dream-list/dream-list.component";
import { CoreModule } from "@_modules/core.module";
import { MatDividerModule } from "@angular/material/divider";
import { CardMenuModule } from "@_controlers/card-menu/card-menu.module";
import { PopupConfirmModule } from "@_controlers/confirm/confirm.module";





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
    PopupConfirmModule
  ]
})

export class DreamListModule { }
