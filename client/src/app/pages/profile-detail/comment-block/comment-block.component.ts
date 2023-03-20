import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { CommentMaterialType } from "@_models/comment";





@Component({
  selector: "app-comment-block",
  templateUrl: "./comment-block.component.html",
  styleUrls: ["./comment-block.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CommentBlockComponent {


  @Input() materialType: CommentMaterialType;
  @Input() materialId: number;
  @Input() materialOwner: number;
  @Input() placeholder: string = "Напишите, что вы об этом думаете . . .";
  @Input() emptyCommentsMainTitle: string = "Нет комментариев";
  @Input() emptyCommentsSubTitle: string = "Будьте первым, напишите свой комментарий";
  @Input() wrapControls: boolean = false;


}
