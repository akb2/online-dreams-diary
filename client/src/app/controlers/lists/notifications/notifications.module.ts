import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { RouterModule } from "@angular/router";
import { InformModule } from "@_controlers/inform/inform.module";
import { NotificationsComponent } from "@_controlers/notifications/notifications.component";
import { ScrollModule } from "@_controlers/scroll/scroll.module";
import { CoreModule } from "@_modules/core.module";
import { NotificationAddToFriendComponent } from "./add-to-friend/add-to-friend.component";
import { NotificationImageComponent } from "./image/image.component";
import { NotificationSendCommentComponent } from "./send-comment/send-comment.component";





@NgModule({
  declarations: [
    NotificationsComponent,
    NotificationImageComponent,
    NotificationAddToFriendComponent,
    NotificationSendCommentComponent
  ],
  exports: [
    NotificationsComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    MatButtonModule,
    MatTooltipModule,
    RouterModule,
    ScrollModule,
    InformModule
  ]
})

export class NotificationsModule { }
