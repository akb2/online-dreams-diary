import { ChangeDetectionStrategy, Component } from "@angular/core";





@Component({
  selector: "app-comment-editor",
  templateUrl: "./comment-editor.component.html",
  styleUrls: ["./comment-editor.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CommentEditorComponent {
}
