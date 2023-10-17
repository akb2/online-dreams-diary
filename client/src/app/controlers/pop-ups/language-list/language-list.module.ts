import { CoreModule } from "@_modules/core.module";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatDialogModule } from "@angular/material/dialog";
import { TranslateModule } from "@ngx-translate/core";
import { PopupLanguageListComponent } from "./language-list.component";





@NgModule({
  declarations: [
    PopupLanguageListComponent
  ],
  exports: [
    PopupLanguageListComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    MatDialogModule,
    TranslateModule
  ]
})

export class PopupLanguageListModule { }
