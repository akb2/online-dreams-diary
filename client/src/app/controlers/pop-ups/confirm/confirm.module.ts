import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { PopupConfirmComponent } from "@_controlers/confirm/confirm.component";
import { CoreModule } from "@_modules/core.module";





@NgModule({
  exports: [
    PopupConfirmComponent
  ],
  declarations: [
    PopupConfirmComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    MatDialogModule,
    MatButtonModule
  ]
})

export class PopupConfirmModule { }
