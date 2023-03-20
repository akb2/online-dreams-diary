import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { User } from "@_models/account";
import { Notification } from "@_models/notification";





@Component({
  selector: "notification-send-comment",
  templateUrl: "./send-comment.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class NotificationSendCommentComponent {
  @Input() notification: Notification;
  @Input() user: User;
  @Input() date: string;
}
