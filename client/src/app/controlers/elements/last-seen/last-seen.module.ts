import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { LastSeenComponent } from "./last-seen.component";





@NgModule({
  declarations: [
    LastSeenComponent
  ],
  exports: [
    LastSeenComponent
  ],
  imports: [
    CommonModule,
    TranslateModule
  ]
})

export class LastSeenModule { }
