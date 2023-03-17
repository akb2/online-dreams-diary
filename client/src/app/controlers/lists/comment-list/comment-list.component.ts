import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { Comment } from "@_models/comment";





@Component({
  selector: "app-comment-list",
  templateUrl: "./comment-list.component.html",
  styleUrls: ["./comment-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CommentListComponent {
  @Input() emptyCommentsMainTitle: string = "Нет комментариев";
  @Input() emptyCommentsSubTitle: string = "Будьте первым, напишите свой комментарий";

  comments: Comment[] = [];

  loading: boolean = false;
}
