import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { User } from "@_models/account";
import { IconColor } from "@_models/app";
import { Notification } from "@_models/notification";





@Component({
  selector: "notification-image",
  templateUrl: "./image.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class NotificationImageComponent {
  @Input() notification: Notification;
  @Input() iconColor: IconColor;
  @Input() icon: string = "bell";
  @Input() image: string;
}
