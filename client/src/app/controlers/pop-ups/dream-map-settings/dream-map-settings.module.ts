import { CoreModule } from "@_modules/core.module";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { MatSliderModule } from "@angular/material/slider";
import { PopupDreamMapSettingsComponent } from "./dream-map-settings.component";





@NgModule({
  exports: [
    PopupDreamMapSettingsComponent
  ],
  declarations: [
    PopupDreamMapSettingsComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    MatDialogModule,
    MatButtonModule,
    MatSliderModule
  ]
})

export class PopupDreamMapSettingsModule { }
