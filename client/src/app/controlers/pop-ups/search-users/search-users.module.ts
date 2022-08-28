import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { InformModule } from "@_controlers/inform/inform.module";
import { PopupSearchUsersComponent } from "@_controlers/search-users/search-users.component";
import { TextInputModule } from "@_controlers/text-input/text-input.module";





@NgModule({
  exports: [
    PopupSearchUsersComponent
  ],
  declarations: [
    PopupSearchUsersComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatDialogModule,
    InformModule,
    FormsModule,
    ReactiveFormsModule,
    TextInputModule,
    MatButtonModule
  ]
})

export class PopupSearchUsersModule { }
