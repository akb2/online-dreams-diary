import { ChangeDetectionStrategy, Component } from "@angular/core";





@Component({
  selector: "app-comment-list",
  templateUrl: "./comment-list.component.html",
  styleUrls: ["./comment-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CommentListComponent {
}
