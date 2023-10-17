import { PopupConfirmComponent } from "@_controlers/confirm/confirm.component";
import { CoreModule } from "@_modules/core.module";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { TranslateModule } from "@ngx-translate/core";





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
    MatButtonModule,
    TranslateModule
  ]
})

export class PopupConfirmModule { }
