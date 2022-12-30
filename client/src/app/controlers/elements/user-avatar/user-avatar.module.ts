import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { InformModule } from "@_controlers/inform/inform.module";
import { UserAvatarComponent } from "@_controlers/user-avatar/user-avatar.component";

@NgModule({
  declarations: [
    UserAvatarComponent
  ],
  exports: [
    UserAvatarComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    InformModule,
    MatTooltipModule
  ]
})

export class UserAvatarModule { }
