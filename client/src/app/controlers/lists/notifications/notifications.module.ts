import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { RouterModule } from "@angular/router";
import { NotificationsComponent } from "@_controlers/notifications/notifications.component";
import { CoreModule } from "@_modules/core.module";





@NgModule({
  declarations: [
    NotificationsComponent
  ],
  exports: [
    NotificationsComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    MatButtonModule,
    MatTooltipModule,
    RouterModule
  ]
})

export class NotificationsModule { }
