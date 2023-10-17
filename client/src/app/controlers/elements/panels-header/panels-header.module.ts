import { LastSeenModule } from "@_controlers/last-seen/last-seen.module";
import { PanelsHeaderComponent } from "@_controlers/panels-header/panels-header.component";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { TranslateModule } from "@ngx-translate/core";





@NgModule({
  declarations: [
    PanelsHeaderComponent
  ],
  exports: [
    PanelsHeaderComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    LastSeenModule,
    TranslateModule
  ],
})

export class PanelsHeaderModule { }
