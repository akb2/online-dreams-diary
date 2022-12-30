import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { UserStatusComponent } from "@_controlers/user-status/user-status.component";

@NgModule({
  declarations: [
    UserStatusComponent
  ],
  exports: [
    UserStatusComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ReactiveFormsModule
  ]
})

export class UserStatusModule { }
