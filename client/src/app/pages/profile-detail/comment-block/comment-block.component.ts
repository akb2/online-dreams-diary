import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { CommentListComponent } from "@_controlers/comment-list/comment-list.component";
import { CommentMaterialType } from "@_models/comment";
import { AccountService } from "@_services/account.service";
import { Subject, takeUntil } from "rxjs";





@Component({
  selector: "app-comment-block",
  templateUrl: "./comment-block.component.html",
  styleUrls: ["./comment-block.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CommentBlockComponent implements OnInit, OnDestroy {


  @Input() materialType: CommentMaterialType;
  @Input() materialId: number;
  @Input() materialOwner: number;
  @Input() placeholder: string = "Напишите, что вы об этом думаете . . .";
  @Input() emptyCommentsMainTitle: string = "Нет комментариев";
  @Input() emptyCommentsSubTitle: string = "Будьте первым, напишите свой комментарий";
  @Input() wrapControls: boolean = false;
  @Input() bottomSmiles: boolean = false;

  @ViewChild("commentListElm", { read: CommentListComponent }) private commentListElm: CommentListComponent;

  authState: boolean = false;

  private destroyed$: Subject<void> = new Subject();





  constructor(
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.accountService.user$()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(user => {
        this.authState = !!user?.id;
        this.changeDetectorRef.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Загрузить больше комментариев
  loadMoreComments(): void {
    if (!!this.commentListElm) {
      this.commentListElm.loadMoreComments();
    }
  }
}
