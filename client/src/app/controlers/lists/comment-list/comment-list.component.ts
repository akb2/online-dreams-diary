import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Comment } from "@_models/comment";
import { CommentService } from "@_services/comment.service";
import { Subject } from "rxjs";





@Component({
  selector: "app-comment-list",
  templateUrl: "./comment-list.component.html",
  styleUrls: ["./comment-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CommentListComponent implements OnInit, OnDestroy {
  @Input() emptyCommentsMainTitle: string = "Нет комментариев";
  @Input() emptyCommentsSubTitle: string = "Будьте первым, напишите свой комментарий";

  comments: Comment[] = [];

  loading: boolean = false;

  private destroyed$: Subject<void> = new Subject();





  constructor(
    private commentService: CommentService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
