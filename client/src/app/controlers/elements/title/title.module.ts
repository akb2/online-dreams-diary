import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { TitleComponent } from "@_controlers/title/title.component";





@NgModule({
  declarations: [
    TitleComponent
  ],
  exports: [
    TitleComponent
  ],
  imports: [
    CommonModule,
    MatIconModule
  ]
})

export class TitleModule { }
