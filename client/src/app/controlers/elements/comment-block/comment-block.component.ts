import { ChangeDetectionStrategy, Component } from "@angular/core";





@Component({
  selector: "app-comment-block",
  templateUrl: "./comment-block.component.html",
  styleUrls: ["./comment-block.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CommentBlockComponent {
}
